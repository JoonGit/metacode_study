// [Task Verification] Phase 4: Core Backend - Auth & Error
package com.smartorder.backend.security;

import java.io.IOException;
import java.util.Collections;

import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.filter.OncePerRequestFilter;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

public class KioskApiKeyFilter extends OncePerRequestFilter {

    private static final String KIOSK_API_KEY_HEADER = "X-Kiosk-Api-Key";
    private static final String STORE_ID_HEADER = "X-Store-Id";

    // In a real scenario, this key might be stored in the database or properties
    private final String expectedApiKey = "default-kiosk-api-key";

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
            throws ServletException, IOException {

        // Check if the request is targeting kiosk APIs
        if (request.getRequestURI().startsWith("/api/kiosk/")) {
            String apiKey = request.getHeader(KIOSK_API_KEY_HEADER);
            String storeId = request.getHeader(STORE_ID_HEADER);

            if (apiKey != null && apiKey.equals(expectedApiKey) && storeId != null) {
                // Authenticate as a KIOSK role
                UsernamePasswordAuthenticationToken auth = new UsernamePasswordAuthenticationToken(
                        "KIOSK_" + storeId, null, Collections.singletonList(new SimpleGrantedAuthority("ROLE_KIOSK")));

                SecurityContextHolder.getContext().setAuthentication(auth);
            } else {
                response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
                response.getWriter().write("Invalid or missing Kiosk API Key / Store ID");
                return;
            }
        }

        filterChain.doFilter(request, response);
    }
}
