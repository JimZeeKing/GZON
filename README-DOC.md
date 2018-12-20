# GZON
_version 0.9.1_
  
A simple JavaScript lib to compress, decompress and optimize json data exchange with GZIP and Base64. This library try to reduce object size by replacing keys with small one. Thus, an object with a lot of different keys that never repeat will be harder to compressed efficiently. **It could event increase the size of the native object**