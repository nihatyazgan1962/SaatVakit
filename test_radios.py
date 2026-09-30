import urllib.request
urls = [
    "https://radyo.duhnet.tv/cnn-turk-radyo",
    "http://ntvradyo.turkmedya.com.tr/ntvradyo",
    "https://turkuvazradyolar.radyotvonline.net/ahaberradyo",
    "https://trthaber.radyotvonline.net/",
    "https://haberturkradyo.radyotvonline.net/",
    "https://diyanetradyo.radyotvonline.net/",
    "https://stream.zeno.fm/f3wvbbqmdg8uv",
    "https://qurango.net/radio/mishary_alafasi",
    "https://qurango.net/radio/abdulbaset_abdulsamad_mojawwad",
    "https://qurango.net/radio/maher_al_muaiqly",
    "https://stream.zeno.fm/q0vqx104a3quv",
    "https://bayramfm.radyotvonline.net/",
    "https://moralfm.radyotvonline.net/",
    "https://stream.zeno.fm/54c5y0r5m2quv",
    "https://stream.zeno.fm/8q14h519w5quv"
]
for u in urls:
    try:
        req = urllib.request.Request(u, headers={'User-Agent': 'Mozilla/5.0'})
        res = urllib.request.urlopen(req, timeout=5)
        print(f"[OK] {u}")
    except Exception as e:
        print(f"[FAIL] {u} - {e}")
