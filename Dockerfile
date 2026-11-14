# Etapa 1: Build de la app Angular con Node 22
FROM node:22-alpine AS build
WORKDIR /app

# Copiar dependencias y asegurar instalación limpia
COPY package*.json ./
RUN npm ci

# Copiar código fuente y compilar para producción
COPY . .
RUN npm run build -- --configuration production

# Etapa 2: Servidor web ultraligero con Nginx
FROM nginx:alpine
COPY --from=build /app/dist/pos-app/browser /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
