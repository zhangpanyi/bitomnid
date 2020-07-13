FROM node:8-alpine

RUN apk add --no-cache git bash python2

COPY app /bitomnid/app
COPY index.js /bitomnid/index.js
COPY package.json /bitomnid/package.json
COPY package-lock.json /bitomnid/package-lock.json

RUN cd /bitomnid && npm i

WORKDIR /bitomnid

EXPOSE 58332