build:
	deno bundle ./src/index.ts ./docs/index.js

watch:
	deno bundle --watch ./src/index.ts ./docs/index.js

server:
	deno run \
		--allow-net \
		--allow-read \
		--config deno_server.jsonc \
		https://deno.land/std@0.123.0/http/file_server.ts \
		-p 8080 \
		docs

build-css:
	sass ./src/index.scss ./docs/index.css

watch-css:
	sass -w ./src/index.scss ./docs/index.css
