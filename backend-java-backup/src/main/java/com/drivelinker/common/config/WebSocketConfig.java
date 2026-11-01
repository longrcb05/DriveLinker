package com.drivelinker.common.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.messaging.simp.config.MessageBrokerRegistry;
import org.springframework.web.socket.config.annotation.EnableWebSocketMessageBroker;
import org.springframework.web.socket.config.annotation.StompEndpointRegistry;
import org.springframework.web.socket.config.annotation.WebSocketMessageBrokerConfigurer;

@Configuration
@EnableWebSocketMessageBroker
public class WebSocketConfig implements WebSocketMessageBrokerConfigurer {

    @Override
    public void configureMessageBroker(MessageBrokerRegistry config) {
        // Khai báo tiền tố cho các kênh (topics) mà client có thể "đăng ký" (subscribe)
        // để lắng nghe
        config.enableSimpleBroker("/topic");

        // Khai báo tiền tố cho các tin nhắn từ client gửi lên server (nếu có)
        config.setApplicationDestinationPrefixes("/app");
    }

    @Override
    public void registerStompEndpoints(StompEndpointRegistry registry) {
        // Tạo endpoint cho Client kết nối WebSocket.
        // Dùng withSockJS() để hỗ trợ các trình duyệt cũ.
        registry.addEndpoint("/ws").setAllowedOriginPatterns("*").withSockJS();
    }
}