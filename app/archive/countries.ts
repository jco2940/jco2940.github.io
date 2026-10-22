// ISO 3166-1 alpha-2 국가 코드를 한국어 이름으로
const NAMES: Record<string, string> = {
  KR: "한국", KP: "북한", US: "미국", JP: "일본", CN: "중국", GB: "영국", DE: "독일", FR: "프랑스", CA: "캐나다",
  AU: "호주", RU: "러시아", NL: "네덜란드", SE: "스웨덴", IT: "이탈리아", ES: "스페인", CH: "스위스",
  SG: "싱가포르", TW: "대만", HK: "홍콩", IN: "인도", NZ: "뉴질랜드", BE: "벨기에", AT: "오스트리아",
  NO: "노르웨이", DK: "덴마크", FI: "핀란드", PL: "폴란드", IL: "이스라엘", MN: "몽골", VN: "베트남",
  ID: "인도네시아", CZ: "체코", UA: "우크라이나", KZ: "카자흐스탄", MY: "말레이시아", TH: "태국", PH: "필리핀",
  BR: "브라질", MX: "멕시코", AR: "아르헨티나", TR: "튀르키예", IR: "이란", NG: "나이지리아", ZA: "남아공",
};

export const countryName = (code: string) => NAMES[code] ?? code;
