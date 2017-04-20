install:
	npm install
start:
	npm run babel-node -- src/bin/page-loader.js https://hexlet.io/courses
test:
	npm test
publish:
	npm publish
lint:
	npm run eslint -- src __tests__

