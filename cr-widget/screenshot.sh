#!/bin/bash
set -ex
declare -r script_dir="$(realpath "$(dirname "${BASH_SOURCE[0]}")")"
declare puppeteer_image='ghcr.io/puppeteer/puppeteer:25.12.0'
image_home="$(docker run --rm "${puppeteer_image}" printenv HOME)"
declare -r image_home

declare -a extra_args=()
if docker --version | grep -qi podman; then
	extra_args+=(
		--userns=keep-id
	)
fi

docker run -i --init --rm \
	"${extra_args[@]}" \
	--user "$(id -u):$(id -g)" \
	-v "${script_dir}:/app" \
	-e "NODE_PATH=${image_home}/node_modules" \
	-e "PUPPETEER_CACHE_DIR=${image_home}/.cache/puppeteer" \
	"${puppeteer_image}" \
	bash -c 'cd /app && node screenshot.js'
