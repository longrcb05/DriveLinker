# Giai đoạn 1: Build file .jar bằng Maven
FROM maven:3.9.6-eclipse-temurin-21 AS build
WORKDIR /app
# Lấy file cấu hình thư viện trước để tận dụng cache của Docker
COPY pom.xml .
RUN mvn dependency:go-offline -B
# Copy mã nguồn và build
COPY src ./src
RUN mvn clean package -DskipTests

# Giai đoạn 2: Chạy ứng dụng với môi trường JRE siêu nhẹ
FROM eclipse-temurin:21-jre
WORKDIR /app
# Copy file .jar đã build từ Giai đoạn 1 sang
COPY --from=build /app/target/drivelinker-0.0.1-SNAPSHOT.jar app.jar

# Mở cổng 8080 ra bên ngoài
EXPOSE 8080

# Chạy ứng dụng
ENTRYPOINT ["java", "-jar", "app.jar"]
