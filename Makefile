install: install-deps build

install-deps:
	npm install

start:
	heroku local -f Procfile

start-backend sb:
	DEBUG=app,app:* DEBUG_COLORS=true npx nodemon --exec npx babel-node server/bin/server.js

start-frontend sf:
	npx webpack serve

build:
	npm run build

db-migrate:
	npx knex migrate:latest

test:
	npm test

cover:
	npm test -- --coverage --coverageProvider=v8

lint:
	npx eslint .

fix:
	npx eslint --fix .

deploy:
	git push heroku HEAD:master

.PHONY: test start