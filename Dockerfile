# Etapa 1: Construcción
FROM node:18-alpine AS build
WORKDIR /app

# Copiar dependencias
COPY package.json package-lock.json ./
RUN npm ci

# Copiar el código fuente
COPY . .

# Compilar la aplicación web (Expo Export)
RUN npx expo export

# Etapa 2: Servidor Web Estático
FROM nginx:alpine
# Copiar los archivos compilados de Expo al servidor Nginx
COPY --from=build /app/dist /usr/share/nginx/html

# Exponer el puerto 80
EXPOSE 80

# Iniciar Nginx
CMD ["nginx", "-g", "daemon off;"]
