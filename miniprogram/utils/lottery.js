function formatBall(n) {
  return String(n).padStart(2, '0');
}

function generateSSQ() {
  const reds = [];

  while (reds.length < 6) {
    const n = Math.floor(Math.random() * 33) + 1;

    if (!reds.includes(n)) {
      reds.push(n);
    }
  }

  reds.sort((a, b) => a - b);

  return {
    reds,
    blue: Math.floor(Math.random() * 16) + 1
  };
}

function formatSSQ(result) {
  return `${result.reds.map(formatBall).join(' ')} | ${formatBall(result.blue)}`;
}

function createSSQSummary(result) {
  const reds = result.reds || [];
  const sum = reds.reduce((total, n) => total + n, 0);
  const oddCount = reds.filter((n) => n % 2 === 1).length;
  const evenCount = reds.length - oddCount;
  const bigCount = reds.filter((n) => n >= 17).length;
  const smallCount = reds.length - bigCount;

  return {
    title: '本次号码摘要',
    sumText: String(sum),
    parityText: `${oddCount}:${evenCount}`,
    sizeText: `${bigCount}:${smallCount}`,
    timeText: result.timeText || '--:--'
  };
}

module.exports = {
  createSSQSummary,
  formatBall,
  formatSSQ,
  generateSSQ
};
