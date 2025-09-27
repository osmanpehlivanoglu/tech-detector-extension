SHELL := /bin/bash

# Extract versions from manifest files
VERSION_CHROME := $(shell sed -n 's/.*"version"[: ]*"\([^"]*\)".*/\1/p' manifest-chrome.json | head -n1)
VERSION_FIREFOX := $(shell sed -n 's/.*"version"[: ]*"\([^"]*\)".*/\1/p' manifest-firefox.json | head -n1)

.PHONY: package-chrome package-firefox package-all clean-dist

dist:
	mkdir -p dist

package-chrome: dist
	@echo "Packaging Chrome (MV3) version $(VERSION_CHROME)"
	@# Backup existing manifest if present
	@if [ -f manifest.json ]; then mv manifest.json .manifest.json.bak; fi
	@cp manifest-chrome.json manifest.json
	@zip -qr "dist/tech-detector-chrome-$(VERSION_CHROME).zip" . \
	  -x '*.git*' 'dist/*' 'tech-detector-*.zip' 'manifest-*.json'
	@rm -f manifest.json
	@if [ -f .manifest.json.bak ]; then mv .manifest.json.bak manifest.json; fi
	@echo "→ dist/tech-detector-chrome-$(VERSION_CHROME).zip"

package-firefox: dist
	@echo "Packaging Firefox (MV2) version $(VERSION_FIREFOX)"
	@# Backup existing manifest if present
	@if [ -f manifest.json ]; then mv manifest.json .manifest.json.bak; fi
	@cp manifest-firefox.json manifest.json
	@zip -qr "dist/tech-detector-firefox-$(VERSION_FIREFOX).zip" . \
	  -x '*.git*' 'dist/*' 'tech-detector-*.zip' 'manifest-*.json'
	@rm -f manifest.json
	@if [ -f .manifest.json.bak ]; then mv .manifest.json.bak manifest.json; fi
	@echo "→ dist/tech-detector-firefox-$(VERSION_FIREFOX).zip"

package-all: package-chrome package-firefox

clean-dist:
	rm -rf dist
	@echo "Cleaned dist/"

