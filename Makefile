install: install

install:
	npm install

start:
	DEBUG=task-manager heroku local -f Procfile

start-backend sb:
	DEBUG=task-manager npx nodemon --exec npx babel-node server/bin/server.js

start-frontend sf:
	DEBUG=task-manager npx webpack serve

build:
	npm run build

lint:
	npx eslint .

fix:
	npx eslint --fix .

test:
	npm test

.PHONY: test start