const { checkMarketOpen } = require("./functions"),
    holidays = require("./holidays");


test("Tests that the market open function", () => {

    var newDate = new Date(Date.parse("Mon Jan 10 2022"));

    expect(checkMarketOpen(newDate, holidays)).toBe(true);

    newDate = new Date(Date.parse("Tue Jan 11 2022"));

    expect(checkMarketOpen(newDate, holidays)).toBe(true);


    newDate = new Date(Date.parse("Wed Jan 12 2022"));

    expect(checkMarketOpen(newDate, holidays)).toBe(true);

    newDate = new Date(Date.parse("Thu Jan 13 2022"));

    expect(checkMarketOpen(newDate, holidays)).toBe(true);

    newDate = new Date(Date.parse("Fri Jan 14 2022"));

    expect(checkMarketOpen(newDate, holidays)).toBe(true);

    newDate = new Date(Date.parse("Sat Jan 15 2022"));

    expect(checkMarketOpen(newDate, holidays)).toBe(false);

    newDate = new Date(Date.parse("Sun Jan 16 2022"));

    expect(checkMarketOpen(newDate, holidays)).toBe(false);



});