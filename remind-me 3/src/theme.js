export function palette(scheme) {
  return scheme === 'dark'
    ? { bg: '#0F1A20', card: '#17252D', ink: '#E8EEF1', mut: '#93A4AD', line: '#26373F', acc: '#4FB4D4', sig: '#F0A81E', on: '#0F1A20', bar: 'light-content' }
    : { bg: '#EDF1F3', card: '#FFFFFF', ink: '#12222B', mut: '#5B6B74', line: '#D5DDE2', acc: '#0F6E8C', sig: '#F0A81E', on: '#FFFFFF', bar: 'dark-content' };
}
