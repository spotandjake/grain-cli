deno task bundle
cd testing.local
../dist/grain compile ./main.gr --verbose
# ./dist/grain format ./test.gr -o ./test.formatted.gr