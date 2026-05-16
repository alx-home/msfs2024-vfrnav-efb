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

#include "main.h"
#include "promise/promise.h"

#include <Windows.h>
#include <wincrypt.h>
#include <iostream>

// Boost includes
#ifdef __clang__
#   pragma clang diagnostic push
#   pragma clang diagnostic ignored "-Weverything"
#endif
#include <boost/asio.hpp>
#include <boost/asio/ssl.hpp>
#include <boost/beast/core.hpp>
#include <boost/beast/http.hpp>
#include <boost/beast/version.hpp>
#include <boost/beast/ssl.hpp>
#include <boost/beast/http.hpp>
#ifdef __clang__
#   pragma clang diagnostic pop
#endif

// Function: Perform HTTP POST to AI API using Boost.Asio/Beast
WPromise<std::string>
Main::PostHttpRequest(
  std::string const&                                                    host,
  std::string const&                                                    port,
  std::string const&                                                    target,
  std::optional<std::function<void(http::request<http::string_body>&)>> build_request,
  http::verb                                                            verb
) {
   return Pool::Dispatch([host          = std::move(host),
                          port          = std::move(port),
                          target        = std::move(target),
                          build_request = std::move(build_request),
                          verb          = std::move(verb)](
                           Resolve<std::string> const& resolve, Reject const& reject
                         ) {
      asio::io_context   ioc;
      asio::ssl::context ctx(asio::ssl::context::tlsv12_client);

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

      http::request<http::string_body> req{verb, target, 11};
      req.set(http::field::host, host);
      req.set(http::field::user_agent, "vfrnav-msfs/1.0 (Boost.Beast)");

      if (build_request) {
         build_request.value()(req);
      }

      req.prepare_payload();

      http::write(stream, req);

      beast::flat_buffer                 buffer;
      http::response<http::dynamic_body> res;
      http::read(stream, buffer, res);

      beast::error_code ec;
      stream.shutdown(ec);

      // Suppress harmless 'stream truncated' error (asio.ssl.stream:1) on shutdown if response
      // was received
      if (ec && ec != beast::errc::not_connected && ec.value() != 1 /* asio.ssl.stream:1 */) {
         reject.Apply<beast::system_error>(ec, "HTTP request failed");
         return;
      }

      // Convert dynamic_body to string
      std::ostringstream oss;
      oss << beast::buffers_to_string(res.body().data());

      (resolve)(oss.str());
   });
}
