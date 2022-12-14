package com.ssafy.gaese.security.config;

import com.ssafy.gaese.security.application.CustomOAuth2UserService;
import com.ssafy.gaese.security.filter.JwtAuthenticationFilter;
import com.ssafy.gaese.security.util.CookieAuthorizationRequestRepository;
import com.ssafy.gaese.security.util.handler.JwtAccessDeniedHandler;
import com.ssafy.gaese.security.util.handler.JwtAuthenticationEntryPoint;
import com.ssafy.gaese.security.util.handler.OAuth2AuthenticationFailureHandler;
import com.ssafy.gaese.security.util.handler.OAuth2AuthenticationSuccessHandler;
import lombok.RequiredArgsConstructor;
import lombok.extern.log4j.Log4j2;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.method.configuration.EnableGlobalMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.builders.WebSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configuration.WebSecurityConfigurerAdapter;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;

@Configuration
@EnableWebSecurity
@Log4j2
@RequiredArgsConstructor
@EnableGlobalMethodSecurity(securedEnabled = true, prePostEnabled = true)
public class SecurityConfig extends WebSecurityConfigurerAdapter {

    private final CustomOAuth2UserService customOAuth2UserService;
    private final CookieAuthorizationRequestRepository cookieAuthorizationRequestRepository;
    private final OAuth2AuthenticationSuccessHandler authenticationSuccessHandler;
    private final OAuth2AuthenticationFailureHandler authenticationFailureHandler;
    private final JwtAuthenticationFilter jwtAuthenticationFilter;
    private final JwtAuthenticationEntryPoint jwtAuthenticationEntryPoint;
    private final JwtAccessDeniedHandler jwtAccessDeniedHandler;


    @Override
    public void configure(WebSecurity web) throws Exception {
        web.ignoring().antMatchers("/h2-console/**", "/favicon.ico");
    }

    @Override
    protected void configure(HttpSecurity http) throws Exception {
        final String[] PERMIT_URL_ARRAY = {
                /* swagger v2 */
                "/v2/api-docs",
                "/swagger-resources",
                "/swagger-resources/**",
                "/configuration/ui",
                "/configuration/security",
                "/swagger-ui.html",
                "/webjars/**",
                /* swagger v3 */
                "/v3/api-docs/**",
                "/swagger-ui/**",
                "/ws/**"
        };

        http.authorizeRequests()
                .antMatchers("/h2-console/**").permitAll()
                .antMatchers("/oauth2/**", "/auth/**").permitAll()
                .antMatchers(PERMIT_URL_ARRAY).permitAll()
//               .antMatchers("*").permitAll()
                .antMatchers("/admin/**").hasRole("ADMIN")
                 .anyRequest().authenticated()
            .and()
                .logout()
                .deleteCookies("refresh")
                .logoutSuccessUrl("/logout");

        http.cors()                     // CORS on
                .and()
                .csrf().disable()           // CSRF off
                .httpBasic().disable()      // Basic Auth off
                .sessionManagement().sessionCreationPolicy(SessionCreationPolicy.STATELESS);    // Session off

        http.formLogin().disable()
                .oauth2Login()
                // ??????????????? ????????? ??????????????? ????????? ????????? URI
                .authorizationEndpoint()
                .baseUri("/oauth2/authorize")
                .authorizationRequestRepository(cookieAuthorizationRequestRepository)
                .and()
                // Authorization ????????? ????????? `Authorization Code`??? ?????? ?????????????????? URI
                .redirectionEndpoint()
                .baseUri("/oauth2/callback/*")
                .and()
                // Provider????????? ????????? ??????????????? ?????? service class??? ???????????????
                .userInfoEndpoint()
                .userService(customOAuth2UserService)
                .and()
                // OAuth2 ????????? ????????? ????????? handler
                .successHandler(authenticationSuccessHandler)
                // OAuth2 ????????? ????????? ????????? handler
                .failureHandler(authenticationFailureHandler);

        // JWT??? ?????? ??? ?????? excepion??? ????????? class??? ??????
        http.exceptionHandling()
                // ?????? ???????????? ?????? exception??? ??????
                .authenticationEntryPoint(jwtAuthenticationEntryPoint)	// 401
                // ?????? ???????????? ?????? exception??? ??????
                .accessDeniedHandler(jwtAccessDeniedHandler);		// 403

        // ?????? request?????? JWT??? ????????? filter??? ??????
        // UsernamePasswordAuthenticationFilter?????? ?????????????????? ????????? ???????????? ??????????????? ?????? ??? ?????? ????????? ?????? ????????? ??? ?????? ?????? jwtAuthenticationFilter??? ??????
        http.addFilterBefore(jwtAuthenticationFilter, UsernamePasswordAuthenticationFilter.class);
    }
}
