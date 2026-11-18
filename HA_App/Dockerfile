# =========================
# Stage 1: Build
# =========================
FROM maven:3.9-eclipse-temurin-21 AS builder

WORKDIR /app

COPY pom.xml .
COPY .mvn .mvn
COPY mvnw .

RUN sed -i 's/\r$//' mvnw 2>/dev/null || true && chmod +x mvnw 2>/dev/null || true

COPY src src

RUN mvn clean package -DskipTests || ./mvnw clean package -DskipTests


# =========================
# Stage 2: Run
# =========================
FROM eclipse-temurin:21-jre

ARG APP_UID=1000
ARG APP_GID=1000

WORKDIR /app

COPY --from=builder /app/target/*.jar app.jar

RUN mkdir -p /app/uploads/audio \
    && chown -R "${APP_UID}:${APP_GID}" /app

USER ${APP_UID}:${APP_GID}

EXPOSE 8080

ENTRYPOINT ["java", "-jar", "app.jar"]
