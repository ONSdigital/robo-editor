// Content for the help panel (src/lib/Help.svelte). Each example's output is rendered live with
// renderJSON and the demo data (data_v2.csv), so it always matches the current robo-utils and Pug.

const pug = (page) => `https://pugjs.org/language/${page}.html`;
const robo = (anchor) => `https://github.com/ONSdigital/robo-utils/blob/main/docs/api.md#${anchor}`;

export const docs = {
	pug: "https://pugjs.org/language/attributes.html",
	robo: "https://github.com/ONSdigital/robo-utils/blob/main/docs/api.md"
};

// The place used for every example
export const examplePlace = "Hartlepool";

// json: show the JSON that renderJSON returns, rather than the rendered HTML
export const sections = [
	{
		id: "pug",
		title: "Writing Pug",
		intro: "Pug describes HTML with indentation instead of closing tags. JavaScript can be used inside #{…}, on lines starting with = or -, and in conditions and loops.",
		examples: [
			{
				title: "Tags, classes and text",
				code: "h2.title Population\np This is a paragraph.",
				link: pug("tags")
			},
			{
				title: "Insert a value",
				code: "p #{place.areanm} has a median age of #{place.age_med}.",
				link: pug("interpolation")
			},
			{
				title: "A whole line of JavaScript",
				code: 'p= place.getName("in")',
				link: pug("code")
			},
			{
				title: "Inline tags",
				code: "p In #[strong #{place.areanm}], the median age is #[em #{place.age_med}].",
				link: pug("interpolation")
			},
			{
				title: "Variables",
				code: '- const change = place.p2020 - place.p2019\np The population changed by #{format(change, ",")}.',
				link: pug("code")
			},
			{
				title: "Conditions",
				code: "if place.age_med > 45\n  p #{place.areanm} has an older population.\nelse\n  p #{place.areanm} has a younger population.",
				link: pug("conditionals")
			},
			{
				title: "Loops",
				code: 'ul\n  each area in places.top("density", 3)\n    li #{area.areanm}: #{area.density.format()} people per sq km',
				link: pug("iteration")
			},
			{
				title: "Mixins",
				note: "A mixin is a reusable block of Pug. Here, the same paragraph is written for the place and its parent area, by passing each row to the mixin.",
				code: "mixin summary(area)\n  p #{area.areanm} has #{area.p2020.format()} people, with a median age of #{area.age_med}.\n\n- const parent = lookup[place.getParent()]\n+summary(place)\n+summary(parent)",
				link: pug("mixins")
			},
			{
				title: "Comments",
				note: "// comments are returned as notes in the JSON output. //- comments are left out.",
				code: "// Version 1.0\n//- Not included anywhere\np Some text",
				json: true,
				link: pug("comments")
			}
		]
	},
	{
		id: "structure",
		title: "Structuring the output",
		intro: "Each top-level section becomes an object in the JSON output, with its id, its class as type, and its HTML as content. Each prop element becomes a field.",
		examples: [
			{
				title: "Sections and props",
				code: 'section#intro.Header\n  prop.title Population #{place.getName("in")}\n  p The population is #{place.p2020.format()}.',
				json: true,
				link: robo("renderjson")
			},
			{
				title: "Lists as props",
				note: "Text separated by | becomes an array.",
				code: "section#chart\n  prop.years 2019|2020",
				json: true,
				link: robo("renderjson")
			},
			{
				title: "Chart data",
				code: 'section#chart.Chart\n  prop.chartType bar\n  prop.data= places.top("density", 3).toData({x: "density", y: "areanm"})',
				json: true,
				link: robo("todata")
			},
			{
				title: "Highlights",
				note: "Text gets a black or white colour to contrast with the background.",
				code: 'p #[mark(style="background-color: #206095") #{place.areanm}] and #[mark(style="background-color: #a8bd3a") England]',
				link: robo("renderjson")
			}
		]
	},
	{
		id: "data",
		title: "Data in templates",
		intro: "place (or row) is the selected row from the CSV, places (or rows) is the filtered list of rows, and lookup gets any row by its code or name. Every robo-utils function is available by name.",
		examples: [
			{ title: "The selected place", code: "p #{place.areanm} (#{place.areacd})" },
			{
				title: "Its parent area",
				code: 'p #{place.areanm} is #{lookup[place.parentcd].getName("in")}.',
				link: robo("magicobjectgetparent")
			},
			{
				title: "Any row by code or name",
				code: 'p #{lookup["E92000001"].areanm}: #{places.get("Leeds").areanm}',
				link: robo("magicarrayget")
			}
		]
	},
	{
		id: "places",
		title: "Finding and sorting places",
		intro: "These return lists of rows, eg. for a loop, toList or a chart.",
		examples: [
			{
				title: "Filter",
				code: 'p= places.filterBy("parentcd", place.parentcd).length',
				link: robo("magicarrayfilterby")
			},
			{
				title: "Highest and lowest",
				code: 'p Largest: #{places.top("p2020", 3).toList("areanm")}\np Smallest: #{places.bottom("p2020").areanm}',
				link: robo("magicarraytop")
			},
			{
				title: "Neighbours in a ranking",
				note: "Areas ranked up to 2 places either side, leaving out the place itself.",
				code: 'p= places.filterBy("parentcd", place.parentcd).between("p2020", place, 2, "around", "descending", null, true).toList("areanm")',
				link: robo("magicarraybetween")
			},
			{
				title: "Sort",
				code: 'p= places.filterBy("parentcd", place.parentcd).sortBy("age_med", "descending").trim(3).toList("areanm")',
				link: robo("magicarraysortby")
			}
		]
	},
	{
		id: "numbers",
		title: "Numbers",
		intro: "Numbers from the CSV have formatting methods, eg. place.p2020.format(). Each is also a function, eg. format(value).",
		examples: [
			{
				title: "Format",
				code: 'p= place.p2020.format()\np= place.p2020.format(",.-3f")\np= place.age_med.format(".0f")',
				link: robo("format")
			},
			{
				title: "Approximate",
				code: "p #{place.areanm} has #{place.p2020.approx()} people.\np= place.p2020.approx(1)",
				link: robo("approx")
			},
			{
				title: "Numbers as words",
				code: 'p= toWords(7)\np= toWords(15)\np= toWords(2, "ordinal")',
				link: robo("towords")
			},
			{
				title: "Fractions",
				code: 'p= toFraction(0.21)\np= toFraction(0.66, "fraction")',
				link: robo("tofraction")
			}
		]
	},
	{
		id: "change",
		title: "Change and comparison",
		examples: [
			{
				title: "Change over time",
				code: 'p The population #{place.p2019.describeChange(place.p2020)}.\np It #{describeChange(place.p2011, place.p2020, {type: "absolute"})} since 2011.',
				link: robo("describechange")
			},
			{
				title: "Compare with another area",
				code: 'p The median age is #{place.age_med.compareTo(lookup["E92000001"].age_med)} England.',
				link: robo("compareto")
			},
			{
				title: "Rank",
				code: '- const region = places.filterBy("parentcd", place.parentcd)\np It is #{region.getRank(place, "p2020").describe("largest")} area #{lookup[place.parentcd].getName("in")}.\np Its median age ranks #{region.getRank(place, "age_med").toWords("ordinal")} in the region.',
				link: robo("magicarraygetrank")
			},
			{
				title: "Words for a difference",
				code: 'p= moreLess(place.p2020 - place.p2019, ["An increase", "A decrease", "No change"])',
				link: robo("moreless")
			}
		]
	},
	{
		id: "text",
		title: "Place names and text",
		examples: [
			{
				title: "Names in context",
				code: 'p= lookup[place.parentcd].getName()\np= lookup[place.parentcd].getName("in")\np= lookup[place.parentcd].getName("its")',
				link: robo("formatname")
			},
			{
				title: "Lists",
				code: 'p= toList(["red", "green", "blue"])\np= toList(["red", "green", "blue"], null, [", ", " or "])',
				link: robo("tolist")
			},
			{
				title: "Words",
				code: 'p= aAn("increase")\np= pluralise("person", 3, true)\np= capitalise("north east")',
				link: robo("aan")
			},
			{
				title: "Dates",
				code: 'p= formatDate("2024-03-04")\np= formatPeriod(2002, 2020)',
				link: robo("formatdate")
			}
		]
	}
];
