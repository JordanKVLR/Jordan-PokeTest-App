import type { TypeName } from "../data/schemas";
import type { Language } from "../game/settings";

/**
 * What trainers say about themselves before the first throw, in both languages.
 *
 * Trainers carry references into these pools rather than the sentences themselves, so the same
 * trainer speaks Maltese or English depending on the player's setting, and a pool index keeps
 * pointing at the same line in both.
 */

export type BoastRef =
  | { kind: "type"; type: TypeName; index: number }
  | { kind: "title"; title: string }
  | { kind: "gym"; medalId: string };

export const TYPE_BOASTS: Record<Language, Record<TypeName, string[]>> = {
  en: {
    Normal: [
      "Nothing fancy in my team. Nothing fancy has ever needed to be.",
      "I train what walks past my door. You would be surprised what that teaches you.",
      "No element, no trick. Just years of it.",
    ],
    Fire: [
      "I keep the lime kilns. You learn what heat does to a thing that won't bend.",
      "Everything I raise has been through a summer on the bare rock. Twice.",
      "Sun's been cooking this island for seven thousand years. I just work with it.",
    ],
    Water: [
      "Forty years off Marsaxlokk. The sea decides, and I've learned to agree with it early.",
      "My father fished this stretch and his before him. The creatures know the family.",
      "You can't out-wait water. People try.",
    ],
    Grass: [
      "Every wall on my land I built myself, and everything green behind them I raised.",
      "Terraces don't forgive a lazy season. Neither do I.",
      "Give me poor soil and a bad year. That's when the good ones show.",
    ],
    Rock: [
      "Third generation in the quarry. I know what's inside a stone before I cut it.",
      "Globigerina under my fingernails since I was nine. It doesn't wash out.",
      "This island is one big block. I've just been taking pieces off it.",
    ],
    Ground: [
      "I've dug more of this island than I've walked on.",
      "Red soil, three feet down, then bedrock. Everything I train comes up through that.",
      "You want to know a place, go under it.",
    ],
    Steel: [
      "The Order left their armour behind. Someone had to keep it standing.",
      "I mend what the sea eats. It's steady work.",
      "Nothing I bring out today is going to break first.",
    ],
    Electric: [
      "I ran the telegraph line when it still meant something. My team kept pace with it.",
      "Storms come off the north in January. I go out in them.",
      "Fast is a decision, not a gift.",
    ],
    Ice: [
      "The tramuntana cracks the limestone. I raise what rides in on it.",
      "Everyone says there's no cold here. Everyone is wrong about January.",
      "Frost gets into stone and splits it from the inside. That's my whole approach.",
    ],
    Flying: [
      "I kept falcons for the tribute. One a year, to an emperor. Standards stayed.",
      "Watch the ridge at dawn and you'll see what I've been training with.",
      "Everything I raise looks down on the rest of the island. Including me.",
    ],
    Fighting: [
      "I carried stone up the Ġgantija hill on a bet. Won it.",
      "No technique. Just more of it than you have.",
      "I've been knocked down on this road before. Ask anyone where I am now.",
    ],
    Psychic: [
      "I sat in the Hypogeum overnight once. Something answered.",
      "The temples are aligned to the solstice. I've been aligned to them a while.",
      "I don't guess what you'll do. I just wait for you to do it.",
    ],
    Ghost: [
      "The catacombs under this town run further than the town does. I know most of them.",
      "You'll hear my team before you see them. That's usually enough.",
      "Nobody buried down there ever really left.",
    ],
    Dark: [
      "I move at night. The island's a different place after ten.",
      "Corsairs worked this coast for three hundred years. Somebody kept their habits.",
      "You won't get a clean look at what I'm sending out.",
    ],
    Fairy: [
      "Every village festa on this island, I've been to. You pick things up.",
      "Luck isn't luck. It's knowing which day to fight on.",
      "The old women bless the boats for a reason. It works.",
    ],
    Bug: [
      "Twenty hives in the valley. The honey pays; the bees teach.",
      "Small and organised beats big and slow. Every time.",
      "You'll be surrounded before you've picked a target.",
    ],
    Poison: [
      "Murex shells, boiled down for the dye. The smell never leaves you, and neither does the lesson.",
      "The viper on this island has a bad name and a worse bite.",
      "I don't need to win the first turn. I just need you to still be here on the fourth.",
    ],
    Dragon: [
      "I've seen the swell that has a shape to it. Once. That was enough.",
      "Sailors name the thing they won't describe. I raised one.",
      "There's older things than the temples out past the harbour mouth.",
    ],
  },
  mt: {
    Normal: [
      "Xejn fancy fit-tim tiegħi. Qatt ma kien hemm bżonn.",
      "Inħarreġ dak li jgħaddi minn quddiem il-bieb tiegħi. Tistagħġeb kemm jgħallmek.",
      "L-ebda element, l-ebda trikk. Snin sħaħ biss.",
    ],
    Fire: [
      "Jien nieħu ħsieb il-kaħħal tal-ġir. Titgħallem x'tagħmel is-sħana lil ħaġa li ma tridx titgħawweġ.",
      "Kull ma rabbejt għadda minn sajf fuq il-blat mikxuf. Darbtejn.",
      "Ix-xemx ilha ssajjar din il-gżira għal sebat elef sena. Jien naħdem magħha biss.",
    ],
    Water: [
      "Erbgħin sena barra Marsaxlokk. Il-baħar jiddeċiedi, u tgħallimt naqbel miegħu kmieni.",
      "Missieri sajjad din il-medda, u missieru qablu. Il-kreaturi jafu l-familja.",
      "Ma tistax tistenna aktar mill-ilma. In-nies jippruvaw.",
    ],
    Grass: [
      "Kull ħajt fl-art tiegħi bnejtu jien, u kull ħaġa ħadra warajhom rabbejtha jien.",
      "It-terrazzi ma jaħfrux staġun għażżien. Lanqas jien.",
      "Agħtini ħamrija fqira u sena ħażina. Hemm jidhru t-tajbin.",
    ],
    Rock: [
      "It-tielet ġenerazzjoni fil-barriera. Naf x'hemm ġo ġebla qabel ma naqtagħha.",
      "Franka taħt id-dwiefer minn meta kelli disa' snin. Ma taħrogx bil-ħasil.",
      "Din il-gżira hija blokka waħda kbira. Jien qed inneħħi biċċiet minnha biss.",
    ],
    Ground: [
      "Ħaffirt aktar minn din il-gżira milli mxejt fuqha.",
      "Ħamrija ħamra, tliet piedi 'l isfel, imbagħad il-blat. Kull ma nħarreġ jitla' minn hemm.",
      "Trid tkun taf post, mur taħtu.",
    ],
    Steel: [
      "L-Ordni ħalliet l-armatura warajha. Xi ħadd kellu jżommha wieqfa.",
      "Insewwi dak li jiekol il-baħar. Xogħol sod.",
      "Xejn minn dak li se noħroġ illum mhu se jinkiser l-ewwel.",
    ],
    Electric: [
      "Kont inħaddem il-linja tat-telegrafu meta kienet għadha tfisser xi ħaġa. It-tim tiegħi żamm il-pass magħha.",
      "Il-maltempati jiġu mit-tramuntana f'Jannar. Jien noħroġ fihom.",
      "Il-veloċità hija deċiżjoni, mhux rigal.",
    ],
    Ice: [
      "It-tramuntana xxaqqaq il-franka. Jien inrabbi dak li jasal fuqha.",
      "Kulħadd jgħid li hawn ma jagħmilx kesħa. Kulħadd żbaljat dwar Jannar.",
      "Is-silġ jidħol fil-ġebla u jifqagħha minn ġewwa. Dak l-approċċ kollu tiegħi.",
    ],
    Flying: [
      "Kont inżomm il-falkuni għat-taxxa. Wieħed fis-sena, lil imperatur. Il-livell baqa'.",
      "Ħares lejn l-għolja mas-sebħ u tara b'xiex ilni nitħarreġ.",
      "Kull ma nrabbi jħares 'l isfel lejn il-bqija tal-gżira. Jien inkluż.",
    ],
    Fighting: [
      "Ġarrejt il-ġebel sal-għolja tal-Ġgantija fuq imħatra. Rbaħtha.",
      "L-ebda teknika. Biss aktar minnha milli għandek int.",
      "Waqajt f'din it-triq qabel. Staqsi lil kulħadd fejn jien issa.",
    ],
    Psychic: [
      "Darba qattajt lejl sħiħ fl-Ipoġew. Xi ħaġa weġbitni.",
      "It-tempji huma allinjati mas-solstizju. Jien ilni allinjat magħhom żmien.",
      "Ma naqtax x'se tagħmel. Nistenna biss li tagħmlu.",
    ],
    Ghost: [
      "Il-katakombi taħt din il-belt imorru aktar 'il bogħod mill-belt innifisha. Naf ħafna minnhom.",
      "Tisma' t-tim tiegħi qabel ma tarah. Normalment dak biżżejjed.",
      "Ħadd minn dawk midfuna hemm isfel qatt ma telaq verament.",
    ],
    Dark: [
      "Jien nimxi bil-lejl. Il-gżira post ieħor wara l-għaxra.",
      "Il-kursari ħadmu din il-kosta għal tliet mitt sena. Xi ħadd żamm id-drawwiet tagħhom.",
      "Mhux se tara sew dak li se noħroġ.",
    ],
    Fairy: [
      "Kull festa tar-raħal f'din il-gżira, kont hemm. Titgħallem l-affarijiet.",
      "Ix-xorti mhix xorti. Hija li tkun taf f'liema jum tiġġieled.",
      "In-nisa x-xjuħ ibierku d-dgħajjes għal raġuni. Taħdem.",
    ],
    Bug: [
      "Għoxrin doqqajs fil-wied. L-għasel iħallas; in-naħal jgħallem.",
      "Żgħir u organizzat jirbaħ lil kbir u bil-mod. Dejjem.",
      "Tkun imdawwar qabel ma tagħżel lil min se tattakka.",
    ],
    Poison: [
      "Qxur tal-murex, mgħollija għaż-żebgħa. Ir-riħa qatt ma titilqek, u lanqas il-lezzjoni.",
      "Il-lifgħa ta' din il-gżira għandha isem ħażin u gidma agħar.",
      "M'għandix bżonn nirbaħ l-ewwel dawra. Għandi bżonn biss li tkun għadek hawn fir-raba'.",
    ],
    Dragon: [
      "Rajt il-mewġa li għandha forma. Darba. Kienet biżżejjed.",
      "Il-baħħara jagħtu isem lil dak li ma jridux jiddeskrivu. Jien rabbejt wieħed.",
      "Hemm affarijiet eqdem mit-tempji 'l barra mill-bokka tal-port.",
    ],
  },
};

export const TITLE_BOASTS: Record<Language, Record<string, string>> = {
  en: {
    "Field Hand": "I've worked someone else's land my whole life. This team is the one thing that's mine.",
    "Quarry Cutter": "Eleven hours a day cutting blocks. This is my idea of a rest.",
    "Net Mender": "I can fix a net blind. Sitting still that long, you think about tactics.",
    "Goat Herd": "Goats go where they like. Training them taught me patience for anything.",
    "Stone Mason": "Every course has to sit true or the whole wall goes. Same with a party.",
    "Salt Raker": "I scrape the pans at Salina. Slow work, and I never miss a square.",
    "Boat Wright": "I build luzzus. Nothing leaves my yard half-finished, including this team.",
    "Bell Ringer": "Three hundred steps up the campanile, six times a day. Ask me about stamina.",
    "Fig Picker": "I know exactly when a thing is ready. It's the only skill I have and it's enough.",
    "Lamp Lighter": "I've walked every street in this town after dark. Nothing out here surprises me.",
    "Cart Driver": "Been up and down this road since before it was paved. I know who's worth stopping for.",
    "Wall Builder": "Rubble walls, no mortar, standing four hundred years. That's my record.",
  },
  mt: {
    "Field Hand": "Ħdimt l-art ta' ħaddieħor ħajti kollha. Dan it-tim huwa l-unika ħaġa li hi tiegħi.",
    "Quarry Cutter": "Ħdax-il siegħa kuljum naqta' l-ġebel. Din l-idea tiegħi ta' mistrieħ.",
    "Net Mender": "Nista' nsewwi xibka b'għajnejja magħluqa. Toqgħod bilqiegħda daqshekk, taħseb fit-tattiċi.",
    "Goat Herd": "Il-mogħoż imorru fejn iridu. It-taħriġ tagħhom għallimni s-sabar għal kollox.",
    "Stone Mason": "Kull filliera trid toqgħod dritta jew jaqa' l-ħajt kollu. L-istess ma' tim.",
    "Salt Raker": "Nobrox il-melħiet tas-Salina. Xogħol bil-mod, u qatt ma naqbeż kaxxa.",
    "Boat Wright": "Nibni l-luzzijiet. Xejn ma joħroġ mit-tarzna tiegħi nofs lest, lanqas dan it-tim.",
    "Bell Ringer": "Tliet mitt tarġa sal-kampnar, sitt darbiet kuljum. Staqsini dwar ir-reżistenza.",
    "Fig Picker": "Naf eżatt meta ħaġa tkun lesta. Hija l-unika ħila li għandi u hija biżżejjed.",
    "Lamp Lighter": "Mxejt kull triq f'din il-belt wara d-dlam. Xejn hawn barra ma jissorprendini.",
    "Cart Driver": "Ilni nitla' u ninżel din it-triq minn qabel ma kienet asfaltata. Naf għal min ta' min jieqaf.",
    "Wall Builder": "Ħitan tas-sejjieħ, bla tajn, wieqfa erba' mitt sena. Dak ir-rekord tiegħi.",
  },
};

const GYM_BOAST: Record<Language, (medalName: string) => string> = {
  en: (medal) => `I hold the ${medal}. Nobody has taken it off me on a good day.`,
  mt: (medal) => `Jien għandi l-${medal}. Ħadd ma ħadhieli f'jum tajjeb.`,
};

/** A boast in the given language. A gym leader's line names their medal, so the caller passes
 * that name in already translated (see Content.boast). */
export function boastText(ref: BoastRef, lang: Language, medalName = ""): string {
  switch (ref.kind) {
    case "type":
      return TYPE_BOASTS[lang][ref.type][ref.index] ?? TYPE_BOASTS.en[ref.type][ref.index];
    case "title":
      return TITLE_BOASTS[lang][ref.title] ?? TITLE_BOASTS.en[ref.title] ?? "";
    case "gym":
      return GYM_BOAST[lang](medalName);
  }
}
