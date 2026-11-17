import json, urllib.request, time
UA={"User-Agent":"Mozilla/5.0"}
out={}
for cc in ["ke","ng","gh","za","tz","ug","rw","ci","sn","cm","cd","bw","zm","zw","et"]:
    for t in range(4):
        try:
            u=f"https://rss.applemarketingtools.com/api/v2/{cc}/music/most-played/100/songs.json"
            d=json.loads(urllib.request.urlopen(urllib.request.Request(u,headers=UA),timeout=40).read())
            out[cc]={"updated":d["feed"].get("updated"),"songs":[{k:r.get(k) for k in ("id","name","artistName","artistId","releaseDate","genres")} for r in d["feed"]["results"]]}
            print(cc,len(out[cc]["songs"])); break
        except Exception as e:
            out[cc]={"error":str(e)}; print(cc,e); time.sleep(10)
json.dump(out,open("_probe/apple.json","w"),indent=0,ensure_ascii=False)
