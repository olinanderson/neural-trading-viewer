
// Returns true only on Mon-Fri (non-holidays)
const checkMarketOpen = (date, holidays) => {
    let marketOpen = true;

    for (let i = 0; i < holidays.length; i++) {
        if (
            date.getFullYear() === holidays[i].year &&
            date.getMonth() === holidays[i].month &&
            date.getDate() === holidays[i].day
        ) {
            marketOpen = false;
        }
    }

    if (date.getDay() === 0 || date.getDay() === 6) {
        marketOpen = false;
    }

    return marketOpen;
};

module.exports.checkMarketOpen = checkMarketOpen;