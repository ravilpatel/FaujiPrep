import sys

def fix_text(text):
    bytes_arr = bytearray()
    for i, char in enumerate(text):
        try:
            bytes_arr.extend(char.encode('cp1252'))
        except UnicodeEncodeError:
            # For characters like \x81, \x8d, \x8f, \x90, \x9d that are undefined in cp1252
            # they are typically decoded as their literal Unicode code points in JS/browsers.
            val = ord(char)
            if val < 256:
                bytes_arr.append(val)
            else:
                # If there's a character that was NOT mojibake (like an actual ₹ entered correctly),
                # it will throw. We should encode it as utf-8 bytes so it passes through unchanged,
                # wait, if it's already a valid character not part of mojibake, leaving it as UTF-8
                # bytes will just re-decode it to itself.
                bytes_arr.extend(char.encode('utf-8'))
    
    # Now decode the reconstructed byte array as UTF-8
    try:
        return bytes_arr.decode('utf-8')
    except UnicodeDecodeError as e:
        print(f"Decode error at {e.start}: {bytes_arr[e.start:e.end]}")
        # fallback, replace errors
        return bytes_arr.decode('utf-8', errors='replace')

try:
    with open('quest.js', 'r', encoding='utf-8') as f:
        text = f.read()

    fixed = fix_text(text)
    
    with open('quest.js', 'w', encoding='utf-8') as f:
        f.write(fixed)
    print("Success!")
except Exception as e:
    print(f"Error: {e}")
