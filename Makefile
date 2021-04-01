install: install-deps

install-deps:
	npm install

start:
	DEBUG=task-manager heroku local -f Procfile

start-backend sb:
	DEBUG=task-manager DEBUG_COLORS=true npx nodemon --exec npx babel-node server/bin/server.js

start-frontend sf:
	DEBUG=task-manager DEBUG_COLORS=true npx webpack serve

build:
	npm run postinstall

watch-db:
	watch heroku pg:info

lint:
	npx eslint .

fix:
	npx eslint --fix .

test:
	npm test

deploy:
	git push heroku HEAD:master

.PHONY: test start