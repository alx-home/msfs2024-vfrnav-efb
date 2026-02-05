/*
 * SPDX-License-Identifier: (GNU General Public License v3.0 only)
 * Copyright © 2024 Alexandre GARCIN
 *
 * This program is free software: you can redistribute it and/or modify it under the terms of the
 * GNU General Public License as published by the Free Software Foundation, version 3.
 *
 * This program is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without
 * even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU
 * General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License along with this program. If
 * not, see <https://www.gnu.org/licenses/>.
 */

#include "IAHandler.h"
#include "PdfExtract.h"
#include "SiaPdfFetch.h"
#include "Registry/Registry.h"
#include "json/json.h"
#include "utils/Scoped.h"
#include "utils/String.h"

#include <codecvt>
#include <exception>
#include <filesystem>
#include <json/json.inl>
#include <variant>
#include <promise/promise.h>
#include <utils/MessageQueue.h>
#include <utils/Scoped.h>

#include <poppler/cpp/poppler-document.h>
#include <poppler/cpp/poppler-page.h>

// Boost includes
#pragma clang diagnostic push
#pragma clang diagnostic ignored "-Wlanguage-extension-token"
#pragma clang diagnostic ignored "-Wgnu-anonymous-struct"
#pragma clang diagnostic ignored "-Wnested-anon-types"
#pragma clang diagnostic ignored "-Wunknown-warning-option"
#pragma clang diagnostic ignored "-Wdeprecated-missing-comma-variadic-parameter"
#include <boost/asio.hpp>
#include <boost/asio/ssl.hpp>
#include <boost/beast/core.hpp>
#include <boost/beast/http.hpp>
#include <boost/beast/version.hpp>
#include <boost/beast/ssl.hpp>
#include <boost/beast/http.hpp>
#pragma clang diagnostic pop

#include <string>
#ifdef _WIN32
#   include <windows.h>
#   include <wincrypt.h>
#   include <openssl/x509.h>
#   include <openssl/x509_vfy.h>
#endif

#include <iostream>
#include <fstream>

namespace ia {

struct FrequencyFile {
   std::map<std::string, std::vector<Frequency>> frequencies_{};

   static constexpr js::Proto PROTOTYPE{
     js::_{"frequencies", &FrequencyFile::frequencies_},
   };
};

Handler::Handler()
   : MessageQueue{"IAH Main"} {
   // Load frequencies from disk
   try {
      auto&      registry = registry::Get();
      auto const path     = *registry.alx_home_->settings_->destination_ + "/Data";

      std::string const filename = path + "/frequencies.json";

      if (std::filesystem::exists(filename)) {
         std::ifstream file(filename);

         if (file.is_open()) {
            std::string content{
              (std::istreambuf_iterator<char>(file)), std::istreambuf_iterator<char>()
            };
            file.close();

            auto data{js::Parse<FrequencyFile>(content)};

            for (auto& [icao, freq] : data.frequencies_) {
               frequencies_.emplace(icao, FrequencyPromise::Resolve(std::move(freq)));
            }
         } else {
            std::cerr << "Warning: Could not open file " << filename << " for reading."
                      << std::endl;
         }
      }
   } catch (const std::exception& e) {
      std::cerr << "Error loading frequencies: " << e.what() << std::endl;
   }
}

Handler::~Handler() {
   // Ensure all pending tasks are completed before writing to disk
   poll_ = nullptr;

   // Overkill: Save frequencies again to ensure we persist any changes made by pending promises
   // that may have resolved while we were waiting for the poll to finish. This is probably not
   // necessary since we wait for all pending tasks to complete before setting poll_ to nullptr, but
   // it adds an extra layer of safety to ensure we don't lose any data.
   SaveFrequencies();
};

void
Handler::SaveFrequencies() {
   // Save frequencies to disk
   try {
      auto&      registry = registry::Get();
      auto const path     = *registry.alx_home_->settings_->destination_ + "/Data";
      std::filesystem::create_directories(path);

      std::string const filename = path + "/frequencies.json";
      std::ofstream     file(filename);

      if (file.is_open()) {
         FrequencyFile data{};

         for (auto const& [icao, promise] : frequencies_) {
            if (!promise.Exception()) {
               data.frequencies_.emplace(icao, promise.Value());
            }
         }

         file << js::Stringify(data);
         file.close();
      } else {
         std::cerr << "Warning: Could not open file " << filename << " for writing." << std::endl;
      }
   } catch (const std::exception& e) {
      std::cerr << "Error saving frequencies: " << e.what() << std::endl;
   }
}

struct AiResponseOk {
   std::string id_;
   std::string object_;
   std::size_t created_ = 0;
   std::string model_;

   struct Choice {
      std::size_t index_ = 0;
      struct Message {
         std::string                role_;
         std::string                content_;
         static constexpr js::Proto PROTOTYPE{
           js::_{"role", &Message::role_},
           js::_{"content", &Message::content_},
         };
      };
      Message                             message_;
      std::variant<js::null, std::string> logprobs_;
      std::variant<js::null, std::string> finish_reason_;
      static constexpr js::Proto          PROTOTYPE{
        js::_{"index", &Choice::index_},
        js::_{"message", &Choice::message_},
        js::_{"logprobs", &Choice::logprobs_},
        js::_{"finish_reason", &Choice::finish_reason_},
      };
   };
   std::vector<Choice> choices_;

   struct Usage {
      double      queue_time_        = 0.0;
      std::size_t prompt_tokens_     = 0;
      double      prompt_time_       = 0.0;
      std::size_t completion_tokens_ = 0;
      double      completion_time_   = 0.0;
      std::size_t total_tokens_      = 0;
      double      total_time_        = 0.0;

      static constexpr js::Proto PROTOTYPE{
        js::_{"queue_time", &Usage::queue_time_},
        js::_{"prompt_tokens", &Usage::prompt_tokens_},
        js::_{"prompt_time", &Usage::prompt_time_},
        js::_{"completion_tokens", &Usage::completion_tokens_},
        js::_{"completion_time", &Usage::completion_time_},
        js::_{"total_tokens", &Usage::total_tokens_},
        js::_{"total_time", &Usage::total_time_},
      };
   };
   std::optional<Usage> usage_;

   std::variant<js::null, std::string> usage_breakdown_;
   std::string                         system_fingerprint_;

   struct XGroq {
      std::string id_;
      std::size_t seed_;

      static constexpr js::Proto PROTOTYPE{
        js::_{"id", &XGroq::id_},
        js::_{"seed", &XGroq::seed_},
      };
   };

   XGroq       x_groq_;
   std::string service_tier_;

   static constexpr js::Proto PROTOTYPE{
     js::_{"id", &AiResponseOk::id_},
     js::_{"object", &AiResponseOk::object_},
     js::_{"created", &AiResponseOk::created_},
     js::_{"model", &AiResponseOk::model_},
     js::_{"choices", &AiResponseOk::choices_},
     js::_{"usage", &AiResponseOk::usage_},
     js::_{"usage_breakdown", &AiResponseOk::usage_breakdown_},
     js::_{"system_fingerprint", &AiResponseOk::system_fingerprint_},
     js::_{"x_groq", &AiResponseOk::x_groq_},
     js::_{"service_tier", &AiResponseOk::service_tier_},
   };
};

struct AiResponseError {
   struct ErrorDetail {
      std::string                message_;
      std::string                type_;
      std::optional<std::string> param_;
      std::optional<std::string> code_;

      static constexpr js::Proto PROTOTYPE{
        js::_{"message", &ErrorDetail::message_},
        js::_{"type", &ErrorDetail::type_},
        js::_{"param", &ErrorDetail::param_},
        js::_{"code", &ErrorDetail::code_},
      };
   };

   ErrorDetail error_;

   static constexpr js::Proto PROTOTYPE{
     js::_{"error", &AiResponseError::error_},
   };
};

using AiResponse = std::variant<AiResponseOk, AiResponseError>;

struct AiRequest {
   std::string model_;
   struct Message {
      std::string role_;
      std::string content_;

      static constexpr js::Proto PROTOTYPE{
        js::_{"role", &Message::role_},
        js::_{"content", &Message::content_},
      };
   };
   std::vector<Message> messages_;

   static constexpr js::Proto PROTOTYPE{
     js::_{"model", &AiRequest::model_},
     js::_{"messages", &AiRequest::messages_},
   };
};

// Function: Perform HTTP POST to AI API using Boost.Asio/Beast
AiResponse
PostRequest(const std::string& api_key, const std::string& json_payload) {
   namespace beast = boost::beast;
   namespace http  = beast::http;
   namespace asio  = boost::asio;
   using tcp       = asio::ip::tcp;

   const std::string host   = "api.groq.com";
   const std::string port   = "443";
   const std::string target = "/openai/v1/chat/completions";

   asio::io_context   ioc;
   asio::ssl::context ctx(asio::ssl::context::tlsv12_client);
   // Force TLS 1.2+ only
   ctx.set_options(
     asio::ssl::context::default_workarounds | asio::ssl::context::no_sslv2
     | asio::ssl::context::no_sslv3 | asio::ssl::context::no_tlsv1 | asio::ssl::context::no_tlsv1_1
   );

#ifdef _WIN32
   // Load Windows system root certificates into OpenSSL context
   HCERTSTORE h_system_store = CertOpenSystemStoreA(0, "ROOT");
   if (h_system_store) {
      X509_STORE*    store     = SSL_CTX_get_cert_store(ctx.native_handle());
      PCCERT_CONTEXT p_context = nullptr;
      while ((p_context = CertEnumCertificatesInStore(h_system_store, p_context)) != nullptr) {
         const unsigned char* encoded = p_context->pbCertEncoded;
         X509*                x509    = d2i_X509(nullptr, &encoded, p_context->cbCertEncoded);
         if (x509) {
            X509_STORE_add_cert(store, x509);
            X509_free(x509);
         }
      }
      CertCloseStore(h_system_store, 0);
   } else {
      std::cerr << "Warning: Could not open Windows ROOT cert store." << std::endl;
      ctx.set_default_verify_paths();
   }
#else
   // Fallback for non-Windows
   try {
      ctx.load_verify_file("cacert.pem");
   } catch (const std::exception& e) {
      std::cerr << "Warning: Could not load cacert.pem: " << e.what() << std::endl;
      ctx.set_default_verify_paths();
   }
#endif

   tcp::resolver                        resolver(ioc);
   beast::ssl_stream<beast::tcp_stream> stream(ioc, ctx);

   // Require peer verification
   stream.set_verify_mode(asio::ssl::verify_peer);

   auto const results = resolver.resolve(host, port);
   beast::get_lowest_layer(stream).connect(results);
   // Set SNI hostname (required by many servers, including Google)
   if (!SSL_set_tlsext_host_name(stream.native_handle(), host.c_str())) {
      beast::error_code ec{static_cast<int>(::ERR_get_error()), asio::error::get_ssl_category()};
      throw beast::system_error{ec, "Failed to set SNI Hostname"};
   }
   beast::error_code handshake_ec;
   stream.handshake(asio::ssl::stream_base::client, handshake_ec);
   if (handshake_ec) {
      std::cerr << "SSL handshake failed: " << handshake_ec.message() << std::endl;
      throw beast::system_error{handshake_ec};
   }

   http::request<http::string_body> req{http::verb::post, target, 11};
   req.set(http::field::host, host);
   req.set(http::field::content_type, "application/json");
   req.set(http::field::user_agent, "vfrnav-msfs/1.0 (Boost.Beast)");
   req.set(http::field::authorization, "Bearer " + api_key);
   req.body() = json_payload;
   req.prepare_payload();

   http::write(stream, req);

   beast::flat_buffer                 buffer;
   http::response<http::dynamic_body> res;
   http::read(stream, buffer, res);

   beast::error_code ec;
   stream.shutdown(ec);

   // Suppress harmless 'stream truncated' error (asio.ssl.stream:1) on shutdown if response was
   // received
   if (ec && ec != beast::errc::not_connected && ec.value() != 1 /* asio.ssl.stream:1 */) {
      throw beast::system_error{ec};
   }

   // Convert dynamic_body to string
   std::ostringstream oss;
   oss << beast::buffers_to_string(res.body().data());

   return js::Parse<AiResponse>(oss.str());
}

void
ReplaceAll(std::string& s, std::string_view from, std::string_view to) {
   size_t pos = 0;
   while ((pos = s.find(from, pos)) != std::string::npos) {
      s.replace(pos, from.size(), to);
      pos += to.size();
   }
}

Handler::FrequencyPromise
Handler::GetFrequency(std::string_view icao) {
   auto [promise, resolve, reject] = promise::Pure<std::vector<Frequency>>();

   // Dispatch the work to the main thread to ensure thread safety when accessing frequencies_ map
   Dispatch([this,
             resolve = std::move(resolve),
             reject  = std::move(reject),
             promise,
             icao = std::string(icao)]() {
      auto it = frequencies_.find(std::string{icao});
      if (it != frequencies_.end()) {
         // If we already have a promise for this ICAO, chain onto it
         it->second
           .Then([resolve = std::move(resolve)](std::vector<Frequency> const& freqs) constexpr {
              (*resolve)(freqs);
           })
           .Catch([reject = std::move(reject)](std::exception_ptr e) constexpr { (*reject)(e); })
           .Detach();
      } else {
         // Otherwise, create a new promise and start the process to fetch frequencies
         frequencies_.emplace(std::string{icao}, std::move(promise));
         ++pending_requests_;

         poll_->Dispatch([this, resolve = std::move(resolve), reject = std::move(reject), icao]() {
            ScopeExit _{[this]() constexpr {
               // Dispatch back to main thread to ensure we don't write to disk concurrently from
               // different threads
               Dispatch([this]() {
                  if (--pending_requests_ == 0) {
                     // If there are no more pending requests, save frequencies to disk
                     // This ensures all promises are resolved before we write to disk.
                     SaveFrequencies();
                  }
               });
            }};

            try {
#ifndef LLM_API_KEY
               MakeReject<std::runtime_error>(*reject, "LLM_API_KEY is not defined at build time");
               return;
#else

               auto const secret =
                 "Y9Q3Ve72nN3PnTXmEtKnS4sggmdsigRMWH9kCDGHpCHyenFKKGhDq5vgBWZ4";  // @todo use
                                                                                  // settings
               auto const url = std::format(
                 "https://bo-prod-sofia-vac.sia-france.fr/api/v1/custom/file-path/{}/AD", icao
               );

               // Fetch the SIA PDF for this ICAO and extract text
               auto const pdf = FetchSiaPdf(url, secret);

               // Load PDF from raw data using Poppler
               auto doc = poppler::document::load_from_raw_data(
                 reinterpret_cast<char const*>(pdf.data()), pdf.size()
               );
               if (!doc) {
                  std::cerr << "Failed to load PDF" << std::endl;
                  MakeReject<std::runtime_error>(*reject, "Failed to load PDF");
                  return;
               }

               auto const pages = doc->pages();

               std::string raw_pdf{};
               raw_pdf.reserve(pages * 1000);  // Rough estimate to avoid multiple reallocations

               for (int i = 0; i < pages; ++i) {
                  std::unique_ptr<poppler::page> p(doc->create_page(i));
                  if (!p) {
                     continue;
                  }

                  // Extract text from this page

                  // Poppler returns text in Latin-1 encoding, so we need to convert it to UTF-8
                  auto const& text = p->text().to_utf8();
                  std::string utf8{text.data(), text.size()};

                  raw_pdf += utf8;
                  raw_pdf += "\n";
               }

               // Prepare the request for the AI API
               AiRequest request{
                 .model_ = "llama-3.3-70b-versatile",
                 .messages_ =
                   {{.role_ = "user",
                     .content_ =
                       "Analyze this VAC extract to deduce frequency informations. Respond ONLY in "
                       "pure JSON strictly following this schema: [{\\\"frequency\\\": number, "
                       "\\\"name\\\": {\\\"local\\\": string, \\\"english\\\": string}, "
                       "\\\"type\\\": \\\"AFIS\\\" | \\\"ATIS\\\" | \\\"TOWER\\\" | \\\"GROUND\\\" "
                       "| \\\"APP\\\" | \\\"A/A\\\" | \\\"FIS\\\" }]. name field must be the name "
                       "a real pilot use to contact this frequency (e.g. for Toussus airport: "
                       "\\\"Toussus tour\\\" or \\\"Toussus sol\\\") and must not contains special "
                       "characters."},
                    {
                      .role_    = "user",
                      .content_ = js::Stringify([&]() {
                         // Preprocess the raw PDF text to extract relevant sections
                         // and context for the AI (reduce token count and improve
                         // accuracy)
                         const auto normalized = NormalizeSpaces(Sanitize(raw_pdf));

                         // Extract the first word of the section (usually the
                         // airport name) to provide as context to the AI
                         const auto section = ExtractBetweenMarkers(
                           normalized, "Public air traffic", "Visual approach"
                         );
                         const auto first_word = ExtractFirstWord(section);

                         // Extract frequency sections to provide as context to the
                         // AI
                         const auto context = ExtractFrequencyContext(normalized);

                         // Combine first word and context to provide a concise
                         // summary of the VAC to the AI
                         return first_word + " " + context;
                      }()),
                    }}
               };

               // Post the request to the AI API and get the response
               auto const response = PostRequest(LLM_API_KEY, js::Stringify(request));

               if (std::holds_alternative<AiResponseError>(response)) {
                  // If the API returned an error, reject the promise with the error message
                  // Usually this means there is no more quota left, or the API key is invalid
                  auto const& error = std::get<AiResponseError>(response);

                  MakeReject<std::runtime_error>(*reject, "API Error: " + error.error_.message_);
                  return;
               }

               // Extract the content from the AI response and parse it as frequencies
               auto const& response_ok     = std::get<AiResponseOk>(response);
               auto const& message_content = response_ok.choices_.back().message_.content_;

               if (response_ok.usage_.has_value()) {
                  std::cout << "AI Usage: " << "Queue Time: " << response_ok.usage_->queue_time_
                            << "s, "
                            << "Prompt Tokens: " << response_ok.usage_->prompt_tokens_ << ", "
                            << "Prompt Time: " << response_ok.usage_->prompt_time_ << "s, "
                            << "Completion Tokens: " << response_ok.usage_->completion_tokens_
                            << ", "
                            << "Completion Time: " << response_ok.usage_->completion_time_ << "s, "
                            << "Total Tokens: " << response_ok.usage_->total_tokens_ << ", "
                            << "Total Time: " << response_ok.usage_->total_time_ << "s"
                            << std::endl;
               }
               auto frequencies = js::Parse<std::vector<Frequency>>(message_content);
               for (auto& freq : frequencies) {
                  ReplaceAll(freq.name_.local_, "A A", "Traffic");
                  ReplaceAll(freq.name_.english_, "A A", "Traffic");

                  ReplaceAll(freq.name_.local_, "A/A", "Traffic");
                  ReplaceAll(freq.name_.english_, "A/A", "Traffic");

                  ReplaceAll(freq.name_.local_, "absence ats", "Traffic");
                  ReplaceAll(freq.name_.english_, "absence ats", "Traffic");
               }

               (*resolve)(frequencies);
#endif
            } catch (...) {
               (*reject)(std::current_exception());
            }
         });
      }
   });

   return std::move(promise);
}

}  // namespace ia