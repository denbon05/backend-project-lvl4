FROM node:14
WORKDIR /app

COPY package.json package.json
COPY package-lock.json package-lock.json

RUN npm ci
RUN curl https://cli-assets.heroku.com/install-ubuntu.sh | sh

COPY . .

EXPOSE 5000
ENV NODE_ENV=production

ENV DB_USER=postgres
ENV DB_PASSWORD=postgres
ENV DB_NAME=postgres
ENV DB_HOST=0.0.0.0
ENV DB_PORT=5432

CMD npm run build && heroku local -f Procfile
