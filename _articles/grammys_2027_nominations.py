FILE = "grammys-2027-nominations.html"
TITLE = "Grammy nominations 2027: the main categories and the African races"
TAG = "The Wrap"
H1 = "Grammy nominations 2027: the main categories and the African races"
DEK = "RAYE and Rosalía lead the field, Beyoncé reaches 100 career nominations, and Tems is up for four awards. Here are the nominees."
META = "The Wrap · Global · 16 Nov 2026 · 4 min read"
LEAD = ("img/gr27-tems.jpg", "Tems, nominated for four Grammys this year", "@temsbaby / Instagram")


def noms(rows):
    li = "".join('<li><span class="t">%s</span><span class="a">%s</span></li>' % (t, a) for t, a in rows)
    return ("raw", '<ul class="noms">%s</ul>' % li)


BODY = [
("p", "The Recording Academy announced the nominees for the 69th Grammy Awards on Monday, 16 November 2026. For the first time, all 100 categories were read out on the livestream, which started at 3:45pm Nairobi time. The winners will be named on Sunday, 7 February 2027, at Crypto.com Arena in Los Angeles, with the show airing on ABC, Disney+ and Hulu."),
("p", "RAYE and Rosalía lead this year’s nominations, Beyoncé became the first artist to reach 100 career nominations, and Tems has four. Below are the nominees in the four main categories and the categories where African artists are competing."),

("h2", "General field", "Album of ", "the Year"),
noms([("Lost Weekend", "Phoebe Bridgers"), ("The Art of Loving", "Olivia Dean"), ("Dandelion", "Ella Langley"),
      ("The Romantic", "Bruno Mars"), ("This Music May Contain Hope.", "RAYE"),
      ("You Seem Pretty Sad for a Girl So in Love", "Olivia Rodrigo"), ("Lux (Complete Works)", "Rosalía"),
      ("The Life of a Showgirl", "Taylor Swift")]),

("h2", "General field", "Record of ", "the Year"),
noms([("Man I Need", "Olivia Dean"), ("Choosin’ Texas", "Ella Langley"), ("I Just Might", "Bruno Mars"),
      ("Where Is My Husband!", "RAYE"), ("The Cure", "Olivia Rodrigo"), ("Berghain", "Rosalía, Björk &amp; Yves Tumor"),
      ("The Fate of Ophelia", "Taylor Swift"), ("Dracula", "Tame Impala with Jennie")]),

("h2", "General field", "Song of ", "the Year"),
noms([("Berghain", "Rosalía, Björk &amp; Yves Tumor"), ("Choosin’ Texas", "Ella Langley"), ("The Cure", "Olivia Rodrigo"),
      ("Hate That I Made You Love Me", "Ariana Grande"), ("I Knew It, I Knew You (from Toy Story 5)", "Taylor Swift"),
      ("Man I Need", "Olivia Dean"), ("Risk It All", "Bruno Mars"), ("Where Is My Husband!", "RAYE")]),
("p", "Song of the Year is a songwriting award, so the trophy goes to the writers. The artist who recorded each song is listed here."),

("h2", "General field", "Best ", "New Artist"),
noms([("Angine de Poitrine", ""), ("Geese", ""), ("Ella Langley", ""), ("Slayyyter", ""),
      ("Sienna Spiro", ""), ("Don Toliver", ""), ("Remi Wolf", ""), ("The Womack Sisters", "")]),

("h2", "Africa", "Best African ", "Music Performance"),
noms([("Gratitude", "Asake"), ("Aye Kan (Are You Coming Back?)", "Angélique Kidjo &amp; Ayra Starr"),
      ("No Tradition, No Africa", "King Ayisoba featuring Rocky Dawuni"), ("Big Daddy", "Tems"),
      ("Jogodo", "Wizkid &amp; Asake")]),
("p", "Asake is in this category twice, once on his own with “Gratitude” and once with Wizkid on “Jogodo”. That song is Wizkid’s seventh career Grammy nomination."),
("p", "Tyla won this award in 2024 with “Water” and again in 2026 with “Push 2 Start”, but she is not nominated this year. That leaves Tems, who won it in 2025 with “Love Me JeJe”, as the only past winner in the field."),
("img", "img/gr27-asake.jpg", "Asake on stage at The O2, London", "@asakefp / Instagram"),

("h2", "Global", "Best Global ", "Music Album"),
noms([("Equilibrivm", "Anitta"), ("Oriadé", "Davido"), ("Hope!!", "Angélique Kidjo"),
      ("Starrgirl", "Ayra Starr"), ("Love Is a Kingdom", "Tems")]),
("p", "Four of the five albums in this category are by African artists. The only exception is Anitta’s <em>Equilibrivm</em>."),

("h2", "Global", "Best Global ", "Music Performance"),
noms([("Varuvaaiy", "Devan Ekambaram featuring Susha"), ("Una Flor En Cada Estrella", "KerreKe, Mireya &amp; Alex E. Chávez"),
      ("Bando [Orchestral]", "Angélique Kidjo featuring Pharrell Williams &amp; Quavo"),
      ("Porcelana", "Rosalía &amp; Dougie F"), ("Dai Dai", "Shakira &amp; Burna Boy")]),
("p", "Burna Boy is back in this category with Shakira on “Dai Dai”. For Angélique Kidjo, “Bando” is her third nomination this year, after “Aye Kan” and her album <em>Hope!!</em>."),
("img", "img/gr27-shakira-burna.jpg", "Shakira and Burna Boy performing “Dai Dai”", "afropop.daily / Instagram"),

("h2", "R&amp;B", "Best R&amp;B ", "Solo Performance"),
noms([("Morning Dew (Donk)", "Beyoncé"), ("Out the Window", "Kehlani"), ("Let Me", "Victoria Monét"),
      ("Pressha", "Jill Scott"), ("What You Need", "Tems")]),
("p", "Beyoncé’s nomination for “Morning Dew (Donk)” is the 100th of her career. No artist has reached that number before. Tems is also nominated for Best R&amp;B Song for “What You Need”, which she wrote with GuiltyBeatz."),
("img", "img/gr27-beyonce.jpg", "Beyoncé", "@beyonce / Instagram"),

("h2", "Rap", "Best ", "Rap Song"),
noms([("E85", "Don Toliver"), ("Errtime", "Cardi B"), ("Girl, Get Up.", "Doechii featuring SZA"),
      ("Let ’Em Know", "T.I."), ("Spend Dat", "Yung Miami")]),

("p", "The full list of nominees in all 100 categories is on <a href=\"https://www.grammy.com/\" target=\"_blank\" rel=\"noopener\">grammy.com</a>."),
]

SOURCES = [
 ("GRAMMY.com: 2027 Grammy nominations live blog", "https://www.grammy.com/live-blog/"),
 ("Complex: 2027 Grammys nominations announced", "https://www.complex.com/music/a/tracewilliamcowen/2027-grammys-nominations"),
 ("HotNewHipHop: Grammy nominations 2027, full list", "https://www.hotnewhiphop.com/1016621-grammy-nominations-2027-full-list"),
 ("Ratings Game Music: 2027 Grammy nominations by category", "https://ratingsgamemusic.com/2026/11/16/2027-grammy-nominations-by-category-see-the-genre-nominees/"),
 ("Yahoo: The 2027 Grammy nominations are here", "https://www.yahoo.com/entertainment/music/articles/2027-grammy-nominations-133047161.html"),
 ("Gold Derby: 2027 Grammy nominees, full list", "https://www.goldderby.com/music/2026/2027-grammy-nominees-full-list-updating-live/"),
 ("Billboard: Grammy nominations 2027, the complete list", "https://www.billboard.com/lists/grammy-nominations-2027-full-list"),
 ("The Hollywood Reporter: 2027 Grammys, the full nominees list", "https://www.hollywoodreporter.com/music/music-news/2027-grammys-nominees-list-1236755720/"),
 ("NPR: 2027 Grammy Awards, the complete list of nominations", "https://www.npr.org/2026/11/16/nx-s1-6037518/2027-grammy-nominations-complete-list"),
 ("notJustOk: Nigerian artists nominated for the 2027 Grammy Awards", "https://notjustok.com/news/nigerian-artists-nominated-for-the-2027-grammy-awards/"),
 ("HuffPost: Beyoncé becomes first artist with 100 Grammy nominations", "https://www.huffpost.com/entry/live-updates_n_6afac912e4b04eba4d44b5f2"),
 ("IOL: Beyoncé makes Grammy history as first artist to reach 100 nominations", "https://iol.co.za/entertainment/celebrity-news/2026-11-16-beyonc-makes-grammy-history-as-first-artist-to-reach-100-nominations/"),
 ("Guardian Nigeria: Grammys 2026, full list of winners (Tyla's second win)", "https://guardian.ng/life/life-features/2026-grammys-full-list-of-winners/"),
 ("Wikipedia: Grammy Award for Best African Music Performance", "https://en.wikipedia.org/wiki/Grammy_Award_for_Best_African_Music_Performance"),
 ("Variety: Grammy nominations 2027, the complete list", "https://variety.com/2026/music/news/grammy-nominations-2027-complete-list-2-1236948743/"),
]
