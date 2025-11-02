import crypto from "crypto";

interface GeneratePasswordOptions {
  uppercase: boolean;
  lowercase: boolean;
  numbers: boolean;
  symbols: boolean;
  symbolsSelection?: Record<string, boolean>;
  length: number;
  excludeSimilar: boolean;
  noRepeat: boolean;
}

export function generatePassword(options: GeneratePasswordOptions): string {
  const {
    uppercase,
    lowercase,
    numbers,
    symbols,
    symbolsSelection,
    length,
    excludeSimilar,
    noRepeat,
  } = options;

  // 各文字種の定義
  const uppercaseChars = excludeSimilar
    ? "ABCDEFGHJKLMNPQRSTUVWXYZ"
    : "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  const lowercaseChars = excludeSimilar
    ? "abcdefghijkmnpqrstuvwxyz"
    : "abcdefghijklmnopqrstuvwxyz";
  const numberChars = excludeSimilar ? "23456789" : "0123456789";

  // 記号の定義（全記号セット）
  const allSymbols: Record<string, string> = {
    exclamation: "!",
    at: "@",
    hash: "#",
    dollar: "$",
    percent: "%",
    caret: "^",
    ampersand: "&",
    asterisk: "*",
    parenthesis: "()",
    underscore: "_",
    plus: "+",
    minus: "-",
    equals: "=",
    bracket: "[]",
    brace: "{}",
    pipe: "|",
    semicolon: ";",
    colon: ":",
    comma: ",",
    period: ".",
    less: "<",
    greater: ">",
    question: "?",
  };

  // 記号の選択処理
  let symbolChars = "!@#$%^&*()_+-=[]{}|;:,.<>?";
  if (symbols && symbolsSelection) {
    symbolChars = Object.entries(allSymbols)
      .filter(([key]) => symbolsSelection[key])
      .map(([, value]) => value)
      .join("");
  }

  // 類似文字を除外する場合の記号処理
  if (excludeSimilar && symbols) {
    // 類似する記号を除外
    // 具体例: _ (アンダースコア), | (パイプ) は数字や文字と見分けにくい
    symbolChars = symbolChars.replace(/[|_]/g, "");
  }

  // 選択された文字種の配列を作成
  const characterSets: { name: string; chars: string }[] = [];
  if (uppercase)
    characterSets.push({ name: "uppercase", chars: uppercaseChars });
  if (lowercase)
    characterSets.push({ name: "lowercase", chars: lowercaseChars });
  if (numbers) characterSets.push({ name: "numbers", chars: numberChars });
  if (symbols) characterSets.push({ name: "symbols", chars: symbolChars });

  // 文字セットが空の場合はエラー
  if (characterSets.length === 0) {
    throw new Error("At least one character type must be selected");
  }

  // 全文字セットを結合
  const charset = characterSets.map((set) => set.chars).join("");

  // セキュアな乱数を生成する関数
  const getSecureRandomInt = (max: number): number => {
    const randomBytes = crypto.randomBytes(4);
    const randomValue = randomBytes.readUInt32BE(0) / 0x100000000;
    return Math.floor(randomValue * max);
  };

  // Fisher-Yates法でシャッフルする関数
  const shuffleArray = (array: string[]): string[] => {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = getSecureRandomInt(i + 1);
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  };

  // パスワード生成
  const passwordChars: string[] = [];
  const chars = charset.split("");

  // 文字種の数より長い場合、各文字種から1文字ずつ先に生成
  if (length > characterSets.length) {
    const usedChars = new Set<string>();

    // 各文字種から1文字ずつ先に生成
    for (const set of characterSets) {
      let char;
      if (noRepeat) {
        const availableChars = set.chars
          .split("")
          .filter((c) => !usedChars.has(c));
        if (availableChars.length === 0) {
          // 利用可能な文字がない場合、制約を無視
          char = set.chars[getSecureRandomInt(set.chars.length)];
        } else {
          char = availableChars[getSecureRandomInt(availableChars.length)];
        }
      } else {
        char = set.chars[getSecureRandomInt(set.chars.length)];
      }
      passwordChars.push(char);
      if (noRepeat) {
        usedChars.add(char);
      }
    }

    // 残りの文字を生成
    const remainingLength = length - characterSets.length;
    for (let i = 0; i < remainingLength; i++) {
      let char;
      if (noRepeat) {
        const availableChars = chars.filter((c) => !passwordChars.includes(c));
        if (availableChars.length === 0) {
          // 利用可能な文字がない場合、制約を無視
          char = chars[getSecureRandomInt(chars.length)];
        } else {
          char = availableChars[getSecureRandomInt(availableChars.length)];
        }
      } else {
        char = chars[getSecureRandomInt(chars.length)];
      }
      passwordChars.push(char);
    }
  } else {
    // 文字種の数以下の場合は通常通り生成
    for (let i = 0; i < length; i++) {
      let char;
      if (noRepeat) {
        const availableChars = chars.filter((c) => !passwordChars.includes(c));
        if (availableChars.length === 0) {
          // 利用可能な文字がない場合、制約を無視
          char = chars[getSecureRandomInt(chars.length)];
        } else {
          char = availableChars[getSecureRandomInt(availableChars.length)];
        }
      } else {
        char = chars[getSecureRandomInt(chars.length)];
      }
      passwordChars.push(char);
    }
  }

  // Fisher-Yates法でシャッフル
  const shuffledPassword = shuffleArray(passwordChars);

  return shuffledPassword.join("");
}
