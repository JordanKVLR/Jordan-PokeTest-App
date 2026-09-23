/**
 * Maltese game content, keyed by the same ids as the data files.
 *
 * English lives in the data files themselves (src/data/*.json, zoneProgression, the quiz) and
 * stays the source of truth; this is the second column. A test checks every id in the data
 * has an entry here, so a new move or creature cannot ship English-only by accident.
 *
 * Proper names — creature names, the gym leaders, the trainers' first names — are not
 * translated. Most of them are Maltese already.
 */

export const MT_TYPES: Record<string, string> = {
  Normal: "Normali",
  Fire: "Nar",
  Water: "Ilma",
  Grass: "Ħaxix",
  Electric: "Elettriku",
  Ice: "Silġ",
  Fighting: "Ġlied",
  Poison: "Velenu",
  Ground: "Art",
  Flying: "Tajjar",
  Psychic: "Psikiku",
  Bug: "Insett",
  Rock: "Blat",
  Ghost: "Spirtu",
  Dragon: "Dragun",
  Dark: "Dlam",
  Steel: "Azzar",
  Fairy: "Fata",
};

export const MT_MOVES: Record<string, string> = {
  tackle: "Daqqa",
  vine_lash: "Frosta tad-Dielja",
  ember: "Ġamra",
  water_jet: "Ġett tal-Ilma",
  spark: "Xrara",
  shadow_snap: "Qabda tad-Dell",
  metal_claw: "Difer tal-Metall",
  bug_bite: "Gidma tal-Insett",
  sand_blast: "Nefħa tar-Ramel",
  psy_pulse: "Taħbita tal-Orakli",
  venom_spit: "Bżieqa Velenuża",
  gale_dive: "Għadsa tar-Riħ",
  palm_strike: "Daqqa tal-Pala",
  glimmer: "Leqqa",
  night_veil: "Velu tal-Lejl",
  frost_chip: "Biċċa Silġ",
  rock_throw: "Tfigħ il-Ġebel",
  wyrm_surge: "Mewġa tad-Dragun",
  mosaic_shard: "Biċċa Mużajk",
  honey_snare: "Nassa tal-Għasel",
  tyrian_dye: "Żebgħa ta' Tir",
  harbour_swell: "Mewġ tal-Port",
  noria_jet: "Ġett tas-Sienja",
  cross_guard: "Ħarsa tas-Salib",
  signal_flare: "Nar tas-Sinjal",
  scimitar_arc: "Ark tax-Xabla",
  legion_charge: "Attakk tal-Leġjun",
  trilithon_slam: "Daqqa tat-Trilitu",
  siege_volley: "Xita tal-Assedju",
  stone_stance: "Qagħda tal-Ġebel",
  bastion_call: "Sejħa tas-Sur",
  war_cry: "Għajta tal-Gwerra",
  oracle_focus: "Ħarsa tal-Orakli",
  honeyed_step: "Pass tal-Għasel",
  sun_dazzle: "Għama tax-Xemx",
  dust_veil: "Velu tat-Trab",
  sirocco_gust: "Buffura tax-Xlokk",
  venom_haze: "Ċpar Velenuż",
  corsair_glare: "Ħarsa tal-Kursar",
  tide_pull: "Ġibda tal-Marea",
  hymn_of_valour: "Innu tal-Qlubija",
  scrap: "Taqbida",
  thorn_barrage: "Xita ta' Xewk",
  arc_flash: "Leqqa Elettrika",
  catacomb_grasp: "Qabda tal-Katakombi",
  quarry_collapse: "Waqgħa tal-Barriera",
  hypogeum_echo: "Eku tal-Ipoġew",
  festa_dazzle: "Għama tal-Festa",
  tramuntana_chill: "Kesħa tat-Tramuntana",
  leviathan_coil: "Tidwira tal-Leviatan",
  headlong_rush: "Ġirja Għamja",
  steady_breath: "Nifs Kalm",
  sun_harvest: "Ħsad tax-Xemx",
  static_charge: "Ċarġ Statiku",
  spirit_drain: "Ġbid tar-Ruħ",
  frost_armour: "Armatura tas-Silġ",
  wyrm_presence: "Preżenza tad-Dragun",
};

export const MT_ITEMS: Record<string, { name: string; description: string }> = {
  melitan_ball: {
    name: "Ballun ta' Melita",
    description: "L-aqwa sengħa fil-gżejjer. Multiplikatur tal-qbid 4.0x.",
  },
  greca_trap: {
    name: "Nassa tal-Greca",
    description: "Nassa tal-qasab minsuġa f'disinn Mediterranju antik. Multiplikatur tal-qbid 1.5x.",
  },
  festa_trap: {
    name: "Nassa tal-Festa",
    description: "Imżejna għall-festa tas-sajf. Multiplikatur tal-qbid 2.0x.",
  },
  pastizz: {
    name: "Pastizz",
    description: "Għaġina friska u mielħa li tinbiegħ f'kull waqfa tal-vapur. Tagħti lura 15 HP.",
  },
  qassata: {
    name: "Qassata",
    description: "Qassata mimlija rkotta, tajba biżżejjed biex tagħti lura 40 HP.",
  },
  ftira_biz_zejt: {
    name: "Ftira biż-Żejt",
    description: "Ftira sħiħa mxarrba biż-żejt taż-żebbuġa, mimlija tadam u tonn — tagħti lura 80 HP.",
  },
  kinnie: {
    name: "Kinnie",
    description:
      "Xarba lokali morra u ħelwa, jgħidu li tkabbar kreatura livell sħiħ f'ġarra waħda. Rari — qatt ma tinbiegħ, tinstab biss wara ġlieda fis-selvaġġ.",
  },
  silent_bell: {
    name: "Qanpiena Siekta",
    description:
      "Jgħidu li ssikket iċ-ċpar madwar iċ-Ċittadella tal-Antikità. Għadha ma tistax tintuża — iċ-Ċittadella għadha ma nbnietx.",
  },
  il_ghajn_charm: {
    name: "Talisman tal-Għajn",
    description: "Protezzjoni kontra s-sfortuna, meħuda mit-twemmin popolari Malti. Għalissa hija biss għad-dehra.",
  },
};

export const MT_STAGES: Record<string, string> = {
  melita_woods: "Imsaġar ta' Melita",
  salina_saltpans: "Il-Melħiet tas-Salina",
  dingli_cliffs: "L-Irdumijiet tad-Dingli",
  ramla_dunes: "Id-Duni tar-Ramla",
  mdina_bastions: "Is-Swar tal-Imdina",
  marsaxlokk_bay: "Il-Bajja ta' Marsaxlokk",
  wied_ghasel: "Wied il-Għasel",
  sirocco_flats: "Il-Wita tax-Xlokk",
  simar_wetlands: "Il-Bwar tas-Simar",
  fort_st_angelo: "Il-Forti Sant'Anġlu",
  mtahleb_terraces: "It-Terrazzi tal-Imtaħleb",
  azure_caverns: "L-Għerien Blu",
  golden_bay: "Ir-Ramel tal-Mixquqa",
  comino_lagoon: "Il-Bejn il-Kmiemen, Kemmuna",
  hagar_qim: "Is-Santwarju ta' Ħaġar Qim",
  delimara_point: "Il-Ponta ta' Delimara",
  ggantija_terrace: "It-Terrazzin tal-Ġgantija",
  ghar_dalam: "Il-Fond ta' Għar Dalam",
  wied_babu: "Il-Kanjon ta' Wied Babu",
  grand_harbour: "Il-Port il-Kbir tal-Belt",
};

/** Keyed by medal id. */
export const MT_GYMS: Record<string, { medalName: string; leaderTitle: string }> = {
  silent_city: { medalName: "Midalja tal-Belt Siekta", leaderTitle: "Gwardjan tal-Belt Siekta" },
  great_siege: { medalName: "Midalja tal-Assedju l-Kbir", leaderTitle: "Kustodju tal-Fortizzi tal-Port" },
  solstice: { medalName: "Midalja tas-Solstizju", leaderTitle: "Leħen il-Bennejja tat-Tempji" },
  grand_harbour: { medalName: "Midalja tal-Port il-Kbir", leaderTitle: "Sid il-Port il-Kbir" },
};

/** Keyed by the English title, since that is what the trainer data carries. */
export const MT_TRAINER_TITLES: Record<string, string> = {
  "Field Hand": "Bidwi",
  "Quarry Cutter": "Barrieri",
  "Net Mender": "Rammendatur tax-Xbieki",
  "Goat Herd": "Mogħoż",
  "Stone Mason": "Bennej",
  "Salt Raker": "Mellieħ",
  "Boat Wright": "Kalafat",
  "Bell Ringer": "Daqqaq tal-Qniepen",
  "Fig Picker": "Qattiegħ tat-Tin",
  "Lamp Lighter": "Xegħħel tal-Fanali",
  "Cart Driver": "Karettier",
  "Wall Builder": "Bennej tal-Ħitan tas-Sejjieħ",
};

export const MT_ERAS: Record<string, string> = {
  wild: "Fawna nattiva",
  neolithic: "Il-Bennejja tat-Tempji · 3600–2500 QK",
  bronze: "Żmien il-Bronż · 2500–700 QK",
  phoenician: "Feniċi u Puniċi · 800–218 QK",
  roman: "Rumani u Biżantini · 218 QK–870 WK",
  arab: "Il-Perjodu Għarbi · 870–1091",
  knights: "L-Ordni ta' San Ġwann · 1530–1798",
  ottoman: "L-Assedju l-Kbir · 1565",
  british: "Il-Perjodu Ingliż · 1800–1964",
};

export const MT_STATS: Record<string, string> = {
  hp: "HP",
  atk: "Attakk",
  def: "Difiża",
  spatk: "Attakk Sp.",
  spdef: "Difiża Sp.",
  speed: "Veloċità",
  accuracy: "Preċiżjoni",
  evasion: "Evażjoni",
};

export const MT_QUIZ: Record<string, { prompt: string; options: string[] }> = {
  ferry: {
    prompt: "Il-vapur bejn il-gżejjer se jitlaq. Fejn tqatta' l-qsim?",
    options: [
      "Taħt il-gverta, qrib is-sħana tal-magna",
      "Fil-pruwa, tara l-mewġ jinkiser",
      "Fid-dell tax-xbieki tal-merkanzija, tieħu ħsieb is-siġar tal-lumi fil-qsari",
    ],
  },
  chore: {
    prompt: "Illum jum ix-xogħol madwar il-port. Liema xogħol toffri li tagħmel?",
    options: [
      "Issewwi l-gradilji tal-melħ taħt ix-xemx ta' nofsinhar",
      "Tiġbed ix-xbieki tas-sajd ta' filgħodu",
      "Tneħħi l-ħaxix ħażin mid-dwieli fuq it-terrazzi tal-għolja",
    ],
  },
  festa: {
    prompt: "Il-festa tar-raħal se tixgħel in-nar fuq il-port illejla. Fejn trid tkun?",
    options: [
      "Eżatt taħt il-murtali, tħoss is-sħana",
      "Fuq dgħajsa żgħira ttir fil-port",
      "Fl-għoljiet, fost iż-żebbuġ, tara minn bogħod",
    ],
  },
};

export const MT_SIGNATURES: Record<string, string> = {
  "Cross of Valour": "Salib il-Qlubija",
  "Solstice Beam": "Raġġ is-Solstizju",
  "Solstice Alignment": "Allinjament tas-Solstizju",
  "Gregale Howl": "Għajta tal-Grigal",
  "Sirocco Judgement": "Ġudizzju tax-Xlokk",
  "Megalith Charge": "Attakk tal-Megalitu",
  "Oracle Flame": "Fjamma tal-Orakli",
  "Hull Ram": "Daqqa tal-Buq",
};

export const MT_FLAVOR: Record<string, string> = {
  fossary:
    "Ħanfusa b'qoxra tal-garigue li tirgħa fl-imsaġar tal-Buskett; jgħidu li l-ħotob fuq daharha jirriflettu l-megaliti.",
  garrigarn:
    "Il-Fossary imkabbar jwaħħal is-sagħtar mgħaffeġ u l-kappar selvaġġ mal-qoxra tiegħu sakemm jidher qisu l-garigue innifsu qam u beda jimxi.",
  qortong: "Ċagħka ta' franka mwebbsa daqs ponn, li titkaxkar mal-qiegħ tal-barrieri.",
  qortaghan:
    "Ċagħaq tal-barriera li ilhom jitgerbu flimkien tant li ngħaqdu f'wieħed. Iħalli xaqq warajh kull fejn imur.",
  xrobbog: "Jbejjet fit-trab u l-ġebel maħlul taħt l-irdumijiet; daqqa b'riġlu tqanqal żerżiq żgħir li jirkeb 'l isfel.",
  xrobbraxx:
    "Jgħix tant fil-fond tal-galleriji mġarrfa li d-dawl ma għadu jfisser xejn għalih. Jikkaċċa bl-eku tal-passi tiegħu stess.",
  bulqajra: "Jitgerbeb qisu blata biex jivvjaġġa, imbagħad joħroġ żewġ ponn tal-ġebel malli jieqaf.",
  bulqajrun:
    "Jitħarreġ kontra l-ħitan tas-swar sakemm il-kukkarda ta' jdejh tibbies daqs il-ġebla li jolqot. Il-barrieri jħallulu offerti biex jolqot band'oħra.",
  luzzitt: "Ħuta tal-port tal-fidda li taqbeż wara l-luzzijiet, tiġri wara l-fdalijiet li jintefgħu mill-poppa.",
  luzzarju:
    "Tirkeb il-mewġa tal-pruwa tad-dgħajjes tas-sajd lura lejn il-port u terfa' ruħha 'l fuq mill-ilma b'ġwienaħ miftuħa daqs qlugħ lateen.",
  marsupp: "Jeħel mal-ktajjen tal-ankri u l-ħbula l-qodma; is-sajjieda jridu jaqilgħuh qabel ma jiekol il-ħabel.",
  marsuppjun:
    "It-tajn tal-port jinġabar fil-ġlata tiegħu matul is-snin sakemm joħroġ saff żejtni li jżomm kull kreatura oħra 'l bogħod mid-daħla tiegħu.",
  kalanka: "Tgħix fuq l-ixtfa tas-sikka koperti bil-qroll 'il barra mill-kosta; il-qoxra tagħha ma tingħarafx mill-blat sakemm tiċċaqlaq.",
  kalankros:
    "Tidħol f'għar tal-baħar u tħalli l-franka tikber fuq daharha, sakemm biex toħroġha tieħu l-irdum magħha.",
  vurjenn: "Jgħodos mill-irdumijiet fl-ilma miftuħ wara l-ħut, u joħroġ kważi mitt metru 'l bogħod minn fejn daħal.",
  vurjenzu: "Jgħodos mill-irdumijiet tad-Dingli mingħajr ma jnaqqas il-veloċità u joħroġ b'ħuta li ma kellux għalfejn jiġri warajha.",
  ondallus:
    "Is-sajjieda x-xjuħ iwaħħlu l-kurrenti qawwija 'l barra mill-blat f'din il-kreatura meta tinqaleb f'irqadha 'l isfel ħafna.",
  ondraguna:
    "Il-mewġa li s-sajjieda jagħtuha isem minflok jiddeskrivuha. Il-baħħara li rawha tidwar taħt buq ma joħorġux iżjed dak l-istaġun.",
  ramliet: "Iħaffer lejn il-ġenb fir-ramel aħmar u fin tad-duni, u jħalli traċċi li jisparixxu mal-buffura li jmiss.",
  ramlietan: "Jibla' ż-żrar hekk kif jikber u jippakkjah fi pjanċi mas-sinsla. Wieħed kbir jiflaħ għal żerżiq ta' blat.",
  xemxun: "Jitgħaxxaq fuq il-ħotob tad-duni maħruqa mix-xemx sakemm il-qxur tiegħu jsiru kważi jaħarqu, imbagħad jiġri 'l bogħod qabel ma jinħaraq.",
  xemxarju:
    "Iżomm wara nofsinhar sħiħ ta' xemx ta' Lulju taħt il-ġilda u jerħih bil-mod matul il-lejl, hekk ir-ramel madwaru qatt ma jiksaħ.",
  dunkorr: "Iffurmat fejn ir-ramel imġorr mir-riħ jingħaqad mal-blat artab matul is-sekli; il-passi tiegħu jdumu aktar minn ħafna bini.",
  dunkorrax: "Jgħarbel il-ħadid mill-ħamrija ħamra u jkabbru f'qoxra. Il-boxxli jduru lejh ferm qabel ma joħroġ fil-wiċċ.",
  sirokk: "Maltempata tar-ramel żgħira b'għajnejn, li tqum kull meta x-xlokk veru jonfoħ mill-baħar.",
  sirokkjun:
    "Itir ġewwa t-trab li jġorr ir-riħ tan-nofsinhar, hekk dak li tara qatt mhu l-kreatura — biss il-forma li jħalli r-ramel madwarha.",
  ossijan: "Jiġbor għadam ibbajjad mix-xemx fil-ħofra tiegħu fid-duni; in-nies jgħidu li l-akbar ħażniet huma tal-eqdem.",
  ossijark:
    "Magħmul mis-saff tal-għadam ta' Għar Dalam, fejn l-ippopotamu u ċ-ċriev jinsabu flimkien. Mhux annimal wieħed u qatt ma kien.",
  qattusepp:
    "Il-qattus tal-port li mhu ta' ħadd u kulħadd jitimgħu. Jidher f'kull tip ta' art fil-gżejjer għax iddeċieda li kollha tiegħu.",
  qattusinja:
    "Ix-xorti ta' disa' kolonji miġbura f'annimal wieħed. Is-sajjieda li jkeċċu waħda minn fuq id-dgħajsa jiġu lura b'xejn, u jafu għaliex.",
  kelbfenek:
    "Kelb tal-fenek imrobbi f'dawn il-gżejjer għal tliet elef sena. Jaħdem kull art li tpoġġih fiha — għalqa, ġebel maħlul, duna jew xatt — u qatt ma jeħtieġ li tgħidlu darbtejn.",
  kelbsajjied:
    "Widnejh jiħmaru meta jersaq lejn riħa. Ġera wara l-priża f'kull tip ta' art fil-gżira u qatt ma ġie msejjaħ lura.",
  hamiemu: "Ħamiema tal-blat li tbejjet fit-toqob tas-swar, fl-għerien tal-baħar, fil-wiċċ tal-barrieri u fin-niċeċ tal-knejjes, bl-istess indifferenza.",
  hamiemarju:
    "Ġarrat messaġġi matul l-Assedju l-Kbir u qatt ma waqfet. Erħiha kullimkien fil-gżejjer u tasal id-dar qablek.",
  silgina:
    "Rxux tax-xitwa li ffriżaw ma' rdum iħares lejn it-tramuntana u ma nħallux meta daret ix-xemx. Terġa' toħroġ mal-marea kull filgħaxija.",
  silgmewga: "Mewġa wieqfa li qatt ma tinkiser. Id-dgħajjes li jgħaddu minnha jiġu lura bojod bil-ġlata sal-fħal.",
  tramunt:
    "L-ewwel xifer kiesaħ tat-tramuntana, ir-riħ tat-tramuntana li jinżel mill-baħar f'Jannar u jxaqqaq il-franka li jonfoħ fuqha.",
  tramuntarju: "Jirkeb il-maltempata sħiħa minflok jaħrab minnha. Ir-rgħajja jaqraw l-istaġun minn kemm kmieni jidher fuq l-għoljiet.",
  karkarun: "Jinħaseb bħala ġebla wieqfa normali sakemm idur jiffaċċjak; jgħidu li l-megaliti l-qodma jgħoddu l-viżitaturi.",
  karkarotta:
    "Iħaffer par xquq f'kull ċangura li jaqsam. Ir-rotot tal-karretti f'Misraħ Għar il-Kbir huma mappa ta' fejn marru l-antenati tiegħu.",
  santwarr: "Jgħidu li jqum biss meta d-dawl tas-solstizju jallinja mal-kamra ta' ġewwa tat-tempju, bħall-ġebel qadim innifsu.",
  santwarjun: "Joqgħod fejn darba kien hemm abside u jżomm l-allinjament eżatt. Fis-solstizju d-dawl għadu jsibu.",
  dormina:
    "Mgħawġa fuq ġenbha f'irqad dejjiemi, eżatt bħall-figura tat-tafal misjuba fl-iżjed kamra fonda tal-Ipoġew. Tkun xi tkun il-ħolma, min jorqod ħdejha jqum jiftakar l-istess kuritur.",
  dorminarja:
    "Torqod bħalma torqod il-figura tat-tafal tal-Ipoġew — fuq ġenbha, kompletament mistrieħa, u toħlom xi ħaġa li aħna lkoll ġewwa fiha.",
  ggantroll:
    "Il-leġġenda tagħti t-tempji lil ġganteża waħda li ġarret il-ġebel wieqaf fuq spallejha. Xi ħaġa għadha tkaxkar il-ġebel fl-għelieqi bil-lejl, u r-rotot li tħalli jinżlu sal-baħar.",
  ggantmastru:
    "Il-ġganteża tal-leġġenda, dik li ġarret il-ġebel tal-Ġgantija sal-għolja waħedha. Għadha terfa' affarijiet li xejn ta' daqsha m'għandu jkun jista'.",
  bornadur:
    "Wieħed li jgħix fil-fosos tal-qamħ tal-irħula fuq l-irdumijiet li ħadu post in-nies tat-tempji. Jaħżen il-qamħ, biċċiet tal-bronż u l-għadwa bl-istess kobor, u jiftakar min ħa x'hiex.",
  bornaduru:
    "Iżomm mal-fosos tal-qamħ tal-insedjament ta' Borġ in-Nadur, fejn il-qamħ kien jinħeba minn min kien ġej wara.",
  kartrutt:
    "Ikaxkar il-qoxra tiegħu mal-franka ratba u jħalli warajh żewġ xquq paralleli. Ħadd ma spjega sew lanqas ir-rotot tal-karretti ta' Clapham Junction.",
  kartruttan:
    "Iġorr tagħbija li ħadd ma rnexxielu jidentifika, fuq binarji li jaqbżu dritt minn fuq l-irdum u jkomplu taħt l-ilma.",
  murexil:
    "Maqlugħa mis-sikka bl-eluf u mgħollija fi btieti mal-kosta. Kull waħda tagħti ftit qtar tal-vjola li żebgħet id-drapp ta' Tir — u tiżbogħ idejn kull min imissha.",
  tirjanu:
    "Il-mastru taż-żebgħa tal-baħar. Il-qoxra tagħha tiskura minn vjola għal kważi iswed maż-żmien, u l-ilma fejn toqgħod jibqa' miżbugħ għal jiem wara li titlaq.",
  lembuqa:
    "Magħmula bħan-negozjanti b'żaqqhom tonda li kienu jġorru l-landa u ż-żejt bejn Kartaġni u l-portijiet hawn. Għadha tbaħħar baxxa fl-ilma, qisha qed iġġorr merkanzija li ħadd ma ħatt.",
  bastimenta: "Kibritilha rostru tal-bronż fuq ġbinha bħalma kellha galera tal-kummerċ, u tbaħħar baxxa fl-ilma għall-istess raġuni.",
  ghajnuq:
    "L-għajn miżbugħa fuq il-pruwa ta' dgħajsa, li kibritilha ġisem. Is-sajjieda għadhom ipinġuha fuq il-luzzu biex tħares lejn l-ilma ta' quddiem, u jinsistu li dawk li jaslu x-xatt qed iħarsu lejn xi ħaġa oħra.",
  ghajnsahha: "Toqgħod fir-ras ta' għajn u taf min ġej jixrob minnha qabel ma jkun ħalla r-raħal.",
  tessera:
    "Madum wieħed tal-art li nħall minn dar f'Melite u qatt ma mar lura. Jirranġa l-biċċiet tiegħu stess meta jaħseb li ħadd mhu qed jgħoddhom.",
  mosaikos:
    "Art sħiħa tal-mużajk imqajma wieqfa. Id-disinn fuq sidru huwa guilloche Ruman li jingħaraf, u jerġa' jitqiegħed f'disinn ġdid wara kull ġlieda li jirbaħ.",
  amforu:
    "L-amforae niżlu ma' kull nawfraġju f'dawn l-istretti, u ftit minnhom telgħu lura. Din għadha tliet kwarti mimlija b'xi ħaġa li kienet żejt taż-żebbuġa elfejn sena ilu.",
  amforjun: "Iġorr merkanzija li għamel hu stess. Kisser is-siġill ta' waħda u dak li joħroġ, wara elfejn sena, għadu tajjeb għax-xorb.",
  laurentu:
    "Kiber fit-terrazzi taż-żebbuġ li ħawlu l-leġjuni u qatt ma telaq. Jilbes il-kuruna tar-rand tiegħu bħal distintiv ta' grad u jaċċetta sfidi minn kull ħaġa iqsar minnu.",
  laurentissu:
    "Jilbes il-kuruna tiegħu stess u għeleb lil kull min ipprova jeħodhielu. Joffri r-rand lil kull min idum tliet rawnds.",
  vipaulus:
    "L-appostlu nawfragu nefaħ il-lifgħa fin-nar u ma ġralu xejn, u l-gżejjer biddlu fehmthom dwaru darbtejn f'minuta. Id-dixxendenti tiegħu għadhom ma jiddejqux mill-fjamma.",
  vipaulinu:
    "Il-lifgħa li qabdet id l-appostlu u ġiet imnefħa fin-nar mingħajr ħsara. Minn dak iż-żmien in-nar ma baqax jimpressjonaha.",
  ghasel:
    "In-naħla tal-għasel tal-gżira stess, żgħira u skura u b'nervituri. Melita ħadet isimha minn dak li tagħmel, u ġġib ruħha qisha taf.",
  nahlija:
    "It-temperament ta' doqqajs sħiħ f'ġisem wieħed. Ix-xehda fuq daharha hija mibnija fuq disinn eqdem minn kull ħajt fil-gżira, u l-għasel fiha jiswa aktar mill-ħajt.",
  larinja:
    "Iċ-ċitru, il-kannamiela u l-qoton waslu kollha fl-istess ftit deċennji, u xi ħaġa fil-ġonna l-ġodda waslet magħhom. Tfuħ bħaż-żahar u ma tiċċaqlaqx mid-dell.",
  larinjola: "Tagħmel il-fjuri u l-frott fl-istess ħin, bħalma kienu jagħmlu l-ġonna mdawra bil-ħitan. Ir-riħa tasal ferm iżjed milli suppost.",
  sienja:
    "Ir-rota tal-katina u l-bramel li kienet iddur fuq kull bir tal-gżira, għadha ddur. Itfa' munita u terfa' l-ilma ħafna wara li l-għalqa li kienet isservi tkun marret.",
  sienjarja: "Iddur fuq fus li kabbret hi stess u terfa' l-ilma l-ġurnata kollha mingħajr ma tintalab. L-għelieqi taħtha qatt ma jonqsu.",
  skudier:
    "L-armatura ta' skudier li tgħallmet toqgħod wieqfa waħedha. Illustrata żżejjed, ħerqana żżejjed, u ssellem lil kull ħaġa li tilbes aktar metall minnha.",
  kavallier:
    "Armatura sħiħa, salib bi tmien ponot, u l-konvinzjoni sħiħa li l-ħajt warajh m'għandux jaqa'. Jiġġieled f'formazzjoni anke meta ma jkun hemm ħadd ħdejh.",
  granmastru:
    "Jikkmanda bħalma kienu jagħmlu l-Gran Mastri tal-Ordni — minn nofs il-linja, b'leħen li jinstema' fuq il-kanuni. L-berġijiet inbnew fuq pjan li donnu għadu qed isegwi.",
  falkun:
    "L-Ordni żammet dawn il-gżejjer għall-kera ta' falkun ħaj wieħed fis-sena, mogħti lill-Imperatur f'Jum il-Qaddisin. Dan huwa t-tip ta' għasfur li bih kienet titħallas dik il-kera, u jaf il-prezz tiegħu.",
  falkunjier: "Il-falkun tat-taxxa, mibgħut lill-Imperatur darba fis-sena għall-kera ta' gżira. Jilbes iċ-ċineg bħal dekorazzjonijiet.",
  jannisar:
    "Dixxiplinat, imħarreġ, u jimxi fuq banda li ħadd ieħor ma jisma'. Niżel l-art fis-sajf tal-1565 u ħadd ma qallu li l-assedju spiċċa.",
  jannisarju:
    "Meħud żgħir, imħarreġ għal xejn ħlief għal dan, u issa ma jistax jieqaf. Jersaq fin-nar għax qatt ma għallmuh l-alternattiva.",
  bombarda:
    "Kanun tal-assedju li għex iżjed mill-karru tiegħu. Jispara balal tal-ġebel lejn l-eqreb fortizza bil-vizzju, u s-swar li jimmira lejhom inbnew ħoxnin biżżejjed biex jifilħulu.",
  bombardun: "Kanun tal-assedju li għex iżjed mill-karru tiegħu u tgħallem jimxi. Il-balal tal-ġebel li jisgħol għadhom qed jitħaffru mis-swar.",
  hilalux:
    "Bandiera li baqgħet fl-arja wara li waqa' l-arblu. Iddur fuq il-port mal-inżul ix-xemx, u titfa' nofs qamar ta' dell li qatt mhu eżatt fejn tgħid ix-xemx li għandu jkun.",
  hilaluna: "Tidher biss kontra l-qamar, u biss il-kontorn. Sakemm tkun fuq rasek, il-ħoss ikun diġà għadda.",
  pustaljon:
    "Mitfugħ f'Birmingham, imqiegħed f'kantuniera, u miżbugħ tant drabi li ċ-ċifra rjali taħt saret xnigħa. Għadu jieħu l-ittri u għadu ma jridx jagħtihom lura.",
  pustaljunar: "Jiġri mal-linja bejn l-arbli tat-telegrafu aktar malajr mill-messaġġ innifsu, u qatt ħadd ma sabqu għal destinazzjoni.",
  konvoj:
    "Baxx fl-ilma u determinat bil-qalb, bħalma daħlu l-konvojs tal-għajnuna taħt il-bumbardamenti. Dak li qed iġorr jgħodd iżjed għalih minn dak li jiġrilu.",
  konvojarma:
    "Daħal minn ħdejn il-breakwater irmunkat, fuq l-aħħar karburant, bil-gżira kollha tħares mis-swar. Minn dakinhar qatt ma għereq.",
  ferrocane: "Kelb tal-għassa tal-fortizza, maħdum mis-sajjetta.",
  ferrocanun: "Kelb tal-għassa tal-fortizza, maħdum mis-sajjetta — li kiber u sar il-forġa nfisha.",
  katakomba: "Għassies tal-katakombi, magħmul ġebel.",
  katakombrun: "Ħa l-forma tal-gallerija li jinfesta, tant li l-kuritur u l-kreatura ma jistgħux jibqgħu jingħarfu minn xulxin.",
  zavorra: "Sikka taż-żavorra, adattata għan-nawfraġju.",
  zavorrun: "Żavorra li ntremiet fil-Port il-Kbir għal erba' sekli u fl-aħħar qamet bilwieqfa.",
  // Legendaries carry an aesthetic line rather than lore.
  aegilord: "Armatura ta' kavallier / motiv tas-salib Malti",
  aegilordan: "Armatura ta' kavallier / motiv tas-salib Malti, bil-viżiera mgħollija",
  megalithos: "Ġebla ta' tempju megalitiku li ttir, imnaqqxa bis-simboli",
  megalithron: "Trilitu sħiħ imqajjem, allinjat mas-solstizju",
  siroccus: "Dragun tal-maltempata tar-ramel, motiv tar-riħ tan-nofsinhar",
  siroccalis: "Ir-riħ tan-nofsinhar li ngħata sinsla",
};
