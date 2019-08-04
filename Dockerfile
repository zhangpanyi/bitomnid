FROM node:8-alpine

RUN apk add --no-cache git bash python2

COPY app /ominibtc/app
COPY index.js /ominibtc/index.js
COPY package.json /ominibtc/package.json
COPY package-lock.json /ominibtc/package-lock.json

RUN cd /ominibtc && npm i

WORKDIR /ominibtc