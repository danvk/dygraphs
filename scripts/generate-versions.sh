#!/bin/mksh
# © 2023 mirabilos <t.glaser@tarent.de> Ⓕ MIT

set -eo pipefail

cat <<\EOF
<!--#set var="pagetitle" value="version history" -->
<!--#include virtual="header.html" -->

<h2>Version History</h2>

<p>For links to download each release, see the <a href="/download.html">Downloads</a> page.</p>

<table class="versions">
EOF

# could be a function converting */_ to b/i but we do not use it anywhere
alias out='print -rn --'

sed \
    -e 's!&!\&amp;!g' \
    -e 's!<!\&lt;!g' \
    -e 's!>!\&gt;!g' \
    -e 's!>!\&gt;!g' \
    -e 's!"!\&#34;!g' \
    -e 's!\[\([^]]*\)\](\(https*://[!-~]*\))!<a href="\2">\1</a>!g' \
    -e 's! `\([^`]*\)`! <tt>\1</tt>!g' \
    <CHANGES.md |&
in_tr=0
in_ul=0
in_li=0
in_p=0
while IFS= read -pr line; do
	was_in_ul=$in_ul
	if (( in_li )); then
		if [[ $line = '  '* ]]; then
			print -r '<br />'
			out "         ${line##+( )}"
			continue
		fi
		print -r '</li>'
		in_li=0
	fi
	if (( in_ul )); then
		if [[ $line = '- '* ]]; then
			out "        <li>${line##-+( )}"
			in_li=1
			continue
		fi
		print -r '      </ul>'
		in_ul=0
	fi
	if [[ $line = '#'* ]]; then
		if [[ $line = '# '* ]]; then
			if (( in_tr )); then
				print -r '    </td>'
				print -r '  </tr>'
			fi
			line=${line#'# '}
			line=${line%')'}
			print -r '  <tr>'
			print -r "    <td>${line%' ('*}<p class=\"date\">${line##*' ('}</p></td>"
			print -r '    <td class="notes">'
			in_tr=1
			continue
		fi
		if [[ $line = '## '* ]]; then
			print -r "      <h4>${line#'## '}</h4><ul>"
			in_ul=1
			continue
		fi
		print -ru2 "E: unsupported headline level"
		print -ru2 "N: $line"
		exit 1
	fi
	if [[ -z $line ]]; then
		if (( in_p )); then
			print -r '</p>'
			in_p=0
		fi
		# in_li/in_ul already handled above
		continue
	fi
	if [[ $line = '- '* ]]; then
		if (( in_p )); then
			print -r '</p>'
			in_p=0
			print -r '      <ul class="moveup">'
		else
			print -r '      <ul>'
		fi
		in_ul=1
		out "        <li>${line##-+( )}"
		in_li=1
		continue
	fi
	if (( in_p )); then
		print -r '<br />'
		print -nr '       '
	elif (( was_in_ul )); then
		print -nr '      <p class="moveup">'
		in_p=1
	else
		print -nr '      <p>'
		in_p=1
	fi
	out "$line"
done
if (( in_p )); then
	print -r '</p>'
fi
if (( in_li )); then
	print -r '</li>'
fi
if (( in_ul )); then
	print -r '      </ul>'
fi
cat <<\EOF
    </td>
  </tr>
</table>

<!--#include virtual="footer.html" -->
EOF
