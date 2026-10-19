#!/bin/bash
set -euo pipefail

main() {
	local script_dir
	script_dir="$(realpath "$(dirname "${BASH_SOURCE[0]}")")"
	local card_url='https://github-readme-stackoverflow.vercel.app/?userID=10788155&theme=default'
	local downloaded
	downloaded="$(mktemp)"
	trap "rm -f '${downloaded}'" EXIT

	curl --fail --silent --show-error --location --max-time 30 --output "${downloaded}" "${card_url}"
	if ! head -c 200 "${downloaded}" | grep -q '<svg'; then
		echo "Response is not an SVG: ${card_url}" >&2
		exit 1
	fi
	chmod 644 "${downloaded}"
	mv "${downloaded}" "${script_dir}/card.svg"
}

main "$@"
