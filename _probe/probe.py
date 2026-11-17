import json, urllib.request, os
UA={"User-Agent":"Mozilla/5.0"}
out={}
for cc in ["ke","ng","gh","za","tz","ug","rw","ci","sn","cm","cd","bw","zm","zw","et"]:
    u=f"https://rss.applemarketingtools.com/api/v2/{cc}/music/most-played/100/songs.json"
    try:
        d=json.loads(urllib.request.urlopen(urllib.request.Request(u,headers=UA),timeout=30).read())
        out[cc]={"updated":d["feed"].get("updated"),"songs":[{k:r.get(k) for k in ("id","name","artistName","releaseDate","url")} for r in d["feed"]["results"]]}
        print(cc,len(out[cc]["songs"]))
    except Exception as e:
        out[cc]={"error":str(e)}; print(cc,e)
json.dump(out,open("_probe/apple.json","w"),indent=0,ensure_ascii=False)
