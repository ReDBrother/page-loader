install:
	npm install
start:
	npm run babel-node -- src/bin/page-loader.js
test:
	npm test
publish:
	npm publish
lint:
	npm run eslint -- src

