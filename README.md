# GZON
_version 0.9.1_
  
[![Build Status](https://travis-ci.com/JimZeeKing/GZON.svg?branch=master)](https://travis-ci.com/JimZeeKing/GZON)

A simple JavaScript lib to compress, decompress and optimize json data exchange with GZIP and Base64. This library try to reduce object size by replacing keys with smaller ones. Thus, an object with a lot of different keys that never repeat will be harder to compressed efficiently. **It could even increase the size of the result for small object**


# Inspiration
I had to work with lots and lots of big json objects and wanted to find a way to compress them better so that i could more easily store them inside localstorage and also spare some bandwidth. At the time, i found this neat lib : https://github.com/tcorral/JSONC wich did a great work, but then i wanted to use it in Node and it would not work. So i decided to try and write my own library to do the job. So thanks to [tcorral](https://github.com/tcorral) for getting me in the right direction. And also thanks to the wonderfull library https://github.com/nodeca/pako, which GZON rely on to do some of its work.
 
# Including the file in your project
Just use one of the two files in the **dist** folder and you are good to go! You could also `require("GZON")` on the source.

# Documentation
You can read throught this [huge documentation](https://jimzeeking.github.io/GZON/GZON.html) :)

# Example
See the [index.html](https://github.com/JimZeeKing/GZON/blob/master/index.html) file to test it live with a demo object.<br>With the demo there, the initial json data is ~25kb and the compressed result is ~3kb. Those results can vary depending of the input object.

# Build
Should you want to update the library, just `npm install` and `npm run bundle` or `npm run bundle-minified` to build the library
