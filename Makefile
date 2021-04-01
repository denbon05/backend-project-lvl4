install: install-deps

install-deps:
	npm install

start:
	heroku local -f Procfile

start-backend sb:
	DEBUG=task-manager DEBUG_COLORS=true npx nodemon --exec npx babel-node server/bin/server.js

start-frontend sf:
	npx webpack serve

build:
	npm run build

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