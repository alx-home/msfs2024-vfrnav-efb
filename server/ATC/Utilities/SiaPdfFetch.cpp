/*
 * SPDX-License-Identifier: (GNU General Public License v3.0 only)
 * Copyright (c) 2024 Alexandre GARCIN
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

#include "SiaPdfFetch.h"

#include <Windows.h>
#include <array>
#include <stdexcept>
#include <string>

#pragma clang diagnostic push
#pragma clang diagnostic ignored "-Weverything"
#include <boost/asio.hpp>
#include <boost/asio/ssl.hpp>
#include <boost/beast/core.hpp>
#include <boost/beast/http.hpp>
#include <boost/beast/ssl.hpp>
#include <boost/url.hpp>
#pragma clang diagnostic pop

#include <openssl/sha.h>

#ifdef _WIN32
#   include <windows.h>
#   include <wincrypt.h>
#   include <openssl/x509.h>
#   include <openssl/x509_vfy.h>
#endif

namespace ia {
namespace {

std::string
Sha512Hex(std::string_view input) {
   std::array<unsigned char, SHA512_DIGEST_LENGTH> hash{};
   SHA512(reinterpret_cast<const unsigned char*>(input.data()), input.size(), hash.data());

   static constexpr std::array HEX{
     '0', '1', '2', '3', '4', '5', '6', '7', '8', '9', 'a', 'b', 'c', 'd', 'e', 'f'
   };
   std::string out;
   out.resize(SHA512_DIGEST_LENGTH * 2);

   for (std::size_t i = 0; i < hash.size(); ++i) {
      out[i * 2]     = HEX[(hash[i] >> 4) & 0x0F];
      out[i * 2 + 1] = HEX[hash[i] & 0x0F];
   }

   return out;
}

std::string
Base64Encode(std::string_view input) {
   static constexpr std::array ENCODING_TABLE{'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K',
                                              'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V',
                                              'W', 'X', 'Y', 'Z', 'a', 'b', 'c', 'd', 'e', 'f', 'g',
                                              'h', 'i', 'j', 'k', 'l', 'm', 'n', 'o', 'p', 'q', 'r',
                                              's', 't', 'u', 'v', 'w', 'x', 'y', 'z', '0', '1', '2',
                                              '3', '4', '5', '6', '7', '+', '/'};

   if (input.empty()) {
      return {};
   }

   const auto  in_size  = input.size();
   const auto  out_size = 4 * ((in_size + 2) / 3);
   std::string out(out_size, '=');

   std::size_t out_index = 0;
   for (std::size_t i = 0; i < in_size; i += 3) {
      const auto b0 = static_cast<unsigned char>(input[i]);
      const auto b1 = static_cast<unsigned char>(i + 1 < in_size ? input[i + 1] : 0);
      const auto b2 = static_cast<unsigned char>(i + 2 < in_size ? input[i + 2] : 0);

      const auto triple = (static_cast<unsigned int>(b0) << 16)
                          | (static_cast<unsigned int>(b1) << 8) | static_cast<unsigned int>(b2);

      out[out_index++] = ENCODING_TABLE[(triple >> 18) & 0x3F];
      out[out_index++] = ENCODING_TABLE[(triple >> 12) & 0x3F];
      out[out_index++] = ENCODING_TABLE[(triple >> 6) & 0x3F];
      out[out_index++] = ENCODING_TABLE[triple & 0x3F];
   }

   const auto padding = (3 - (in_size % 3)) % 3;
   for (std::size_t i = 0; i < padding; ++i) {
      out[out_size - 1 - i] = '=';
   }

   return out;
}

boost::asio::ssl::context
CreateSslContext() {
   namespace asio = boost::asio;
   asio::ssl::context ctx(asio::ssl::context::tlsv12_client);
   ctx.set_options(
     asio::ssl::context::default_workarounds | asio::ssl::context::no_sslv2
     | asio::ssl::context::no_sslv3 | asio::ssl::context::no_tlsv1 | asio::ssl::context::no_tlsv1_1
   );

#ifdef _WIN32
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
      ctx.set_default_verify_paths();
   }
#else
   ctx.set_default_verify_paths();
#endif

   return ctx;
}

std::vector<std::byte>
ReadResponseBody(const boost::beast::http::response<boost::beast::http::dynamic_body>& res) {
   const auto             buffers = res.body().data();
   const auto             size    = boost::asio::buffer_size(buffers);
   std::vector<std::byte> out(size);
   boost::asio::buffer_copy(boost::asio::buffer(out), buffers);
   return out;
}

}  // namespace

std::string
BuildSiaAuthToken(std::string_view url, std::string_view secret) {
   const auto pos         = url.find("/api/");
   const auto suffix      = (pos == std::string_view::npos) ? url : url.substr(pos + 5);
   const auto token_input = std::string(secret) + "/api/" + std::string(suffix);
   const auto token_uri   = Sha512Hex(token_input);

   const auto json = std::string{R"({"tokenUri":")"} + token_uri + "\"}";
   return Base64Encode(json);
}

std::vector<std::byte>
FetchSiaPdf(std::string_view url, std::string_view secret) {
   namespace asio  = boost::asio;
   namespace http  = boost::beast::http;
   namespace beast = boost::beast;
   using tcp       = asio::ip::tcp;

   auto parsed = boost::urls::parse_uri(url);
   if (!parsed) {
      throw std::runtime_error("Invalid SIA URL");
   }

   const auto& uv = parsed.value();
   if (uv.scheme() != "https") {
      throw std::runtime_error("Only https scheme is supported for SIA PDF fetch");
   }

   const auto host = std::string(uv.host());
   const auto port = uv.has_port() ? std::string(uv.port()) : std::string{"443"};
   const auto target =
     uv.encoded_target().empty() ? std::string{"/"} : std::string(uv.encoded_target());

   asio::io_context                     ioc;
   auto                                 ctx = CreateSslContext();
   tcp::resolver                        resolver(ioc);
   beast::ssl_stream<beast::tcp_stream> stream(ioc, ctx);

   stream.set_verify_mode(asio::ssl::verify_peer);

   auto const results = resolver.resolve(host, port);
   beast::get_lowest_layer(stream).connect(results);
   if (!SSL_set_tlsext_host_name(stream.native_handle(), host.c_str())) {
      beast::error_code ec{static_cast<int>(::ERR_get_error()), asio::error::get_ssl_category()};
      throw beast::system_error{ec, "Failed to set SNI Hostname"};
   }

   beast::error_code handshake_ec;
   stream.handshake(asio::ssl::stream_base::client, handshake_ec);
   if (handshake_ec) {
      throw beast::system_error{handshake_ec};
   }

   http::request<http::empty_body> req{http::verb::get, target, 11};
   req.set(http::field::host, host);
   req.set(http::field::user_agent, "vfrnav-msfs/1.0 (Boost.Beast)");
   req.set(http::field::accept, "application/pdf");
   req.set("Auth", BuildSiaAuthToken(url, secret));

   http::write(stream, req);

   beast::flat_buffer                 buffer;
   http::response<http::dynamic_body> res;
   http::read(stream, buffer, res);

   if (res.result() != http::status::ok) {
      throw std::runtime_error(
        "SIA PDF fetch failed with status " + std::to_string(res.result_int())
      );
   }

   beast::error_code ec;
   stream.shutdown(ec);
   if (ec && ec != beast::errc::not_connected && ec.value() != 1 /* asio.ssl.stream:1 */) {
      throw beast::system_error{ec};
   }

   return ReadResponseBody(res);
}

}  // namespace ia
