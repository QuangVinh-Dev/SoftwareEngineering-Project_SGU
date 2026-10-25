# =========================
# Stage 1: Build
# =========================
FROM maven:3.9-eclipse-temurin-21 AS builder

WORKDIR /app

COPY pom.xml .
COPY .mvn .mvn
COPY mvnw .

RUN chmod +x mvnw

RUN ./mvnw dependency:go-offline -B

COPY src src

RUN ./mvnw clean package -DskipTests


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
