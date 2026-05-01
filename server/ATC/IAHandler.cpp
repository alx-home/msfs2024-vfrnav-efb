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

#include "main.h"

#include <json/json.inl>
#include <variant>
#include <promise/promise.h>
#include <utils/MessageQueue.h>
#include <utils/Scoped.h>

#include <poppler/cpp/poppler-document.h>
#include <poppler/cpp/poppler-page.h>

// Boost includes
#pragma clang diagnostic push
#pragma clang diagnostic ignored "-Weverything"
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

namespace ia {

Handler::Handler(Main& main)
   : MessageQueue{"IAH Main"}
   , main_(main) {}

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

// WPromise<std::vector<Frequency>>
// Handler::GetFrequency(std::string const& icao) {
//    return sia_extractor_.GetFrequencies(icao);
// }

}  // namespace ia