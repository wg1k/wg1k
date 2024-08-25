#!/bin/bash
declare -r script_dir="$(realpath "$(dirname "${BASH_SOURCE[0]}")")"
set -ex
declare puppeteer_image='ghcr.io/puppeteer/puppeteer:16.1.0'
declare docker_uid="$(docker run --rm "${puppeteer_image}" id -u)"
sudo chown -R "${docker_uid}" "${script_dir}"
trap 'sudo chown -R "${USER}" "${script_dir}"' EXIT
docker run -i --init --rm \
	-v "${script_dir}:/app" \
	"${puppeteer_image}" \
	bash -c 'cp /app/screenshot.js .; node screenshot.js'
