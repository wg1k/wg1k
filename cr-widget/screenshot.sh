#!/bin/bash
set -ex

main() {
	local script_dir
	script_dir="$(realpath "$(dirname "${BASH_SOURCE[0]}")")"
	local puppeteer_image='ghcr.io/puppeteer/puppeteer:25.12.0'
	local image_home
	image_home="$(docker run --rm "${puppeteer_image}" printenv HOME)"

	local -a extra_args=()
	if docker --version | grep -qi podman; then
		extra_args+=(
			--userns=keep-id
		)
	fi

	docker run -i --init --rm \
		"${extra_args[@]}" \
		--user "$(id -u):$(id -g)" \
		--env "NODE_PATH=${image_home}/node_modules" \
		--env "PUPPETEER_CACHE_DIR=${image_home}/.cache/puppeteer" \
		--volume "${script_dir}:/app" \
		--workdir /app \
		"${puppeteer_image}" \
		node screenshot.js
}

main "$@"
