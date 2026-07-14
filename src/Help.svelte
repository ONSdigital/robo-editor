<script>
	import CodeBlock from "./ui/CodeBlock.svelte";
</script>

<p style:margin-top="6px">
	Within the PUG template, Javascript code will only be executed if it's enclosed within a block,
	like <strong>{`#{code_here}`}</strong>. The examples below use <strong>place</strong> (selected
	row), <strong>places</strong> (all rows) and <strong>lookup</strong> (get a row by id/name) to
	reference data from the CSV. You can use <strong>row</strong> and <strong>rows</strong> also.
</p>

<h3>Sorting and filtering data</h3>

<p>
	These functions format data as an array of rows/places, eg. to pass to a each loop, mixin
	function or chart. They will not directly render anything in the output.
</p>

<p>Local authorities (LAs) in London</p>
<CodeBlock code={`places.filterBy("parentcd", "E12000007")`} />

<p>LAs in London, sorted by population (descending)</p>
<CodeBlock code={`places.filterBy("parentcd", "E12000007").descending("population_2011")`} />

<p>LAs in London, sorted by area name (ascending)</p>
<CodeBlock code={`places.filterBy("parentcd", "E12000007").ascending("areanm")`} />

<p>Single largest LA in London</p>
<CodeBlock code={`places.filterBy("parentcd", "E12000007").top("population_2011")`} />

<p>Smallest 5 LAs in London</p>
<CodeBlock code={`places.filterBy("parentcd", "E12000007").bottom("population_2011", 5)`} />

<p>Population of top 10 areas in England and Wales, formatted for a bar chart</p>
<CodeBlock code={`places.top("population_2011", 10).toData({x: "population_2011", y: "areanm"})`} />

<p>Get top 3 places for a column and return their names as a list</p>
<CodeBlock
	code={`places.top("population_2011", 3).toList("areanm") // eg. "Birmingham, Leeds and Sheffield"`}
/>

<p>Population timeseries for Birmingham</p>
<CodeBlock
	code={`lookup["Birmingham"].toData({x: ["2001", "2011"], y: ["population_2001", "population_2011"]})`}
/>

<h3>Formatting words and numbers</h3>

<p>Get a place name and format it in useful ways</p>
<CodeBlock
	code={`place.getName() // returns "Bristol", "Isle of Wight"
place.getName("the") // returns "Bristol", "the Isle of Wight"
place.getName("in") // returns "in Bristol", "on the Isle of Wight"`}
/>

<p>
	The <strong>format</strong> function is based on
	<a href="https://github.com/d3/d3-format" target="_blank">d3-format</a>. See
	<a href="https://observablehq.com/@d3/d3-format" target="_blank">these examples</a> for more ways
	to use it.
</p>

<p>Round to nearest 100 (minus 2 decimals) with thousand separator</p>
<CodeBlock code={`place.column_key.format(",.-2f")`} />

<p>Round to 1dp</p>
<CodeBlock code={`place.column_key.format(".1f")`} />

<p>Return the absolute value (no negatives) and round it to the nearest whole number (0 dp)</p>
<CodeBlock code={`place.column_key.abs().format(".0f")`} />

<p>Conditional text ("higher", "lower" etc)</p>
<CodeBlock
	code={`moreLess(place.column_key1 - place.column_key2, ["higher than", "lower than", "the same as"])`}
/>

<p>Display numbers less than 10 as text (cardinal is the default)</p>
<CodeBlock code={`place.column_key.toWords() // eg. "one", "seven", "15"`} />

<p>Display a number as text, ordinal</p>
<CodeBlock code={`place.column_key.toWords("ordinal") // eg. "first", "seventh", "15th"`} />

<p>Calculate a rank and display it as text</p>
<CodeBlock
	code={`places.getRank(place, "column_key").toWords("ordinal") // eg. "first", "seventh", "15th"`}
/>

<p>
	You also have the option to return an empty string instead of "first", to avoid saying things
	like "first highest"
</p>
<CodeBlock
	code={`places.getRank(place, "column_key").toWords("ordinal", {dropFirst: true}) // eg. "", "seventh", "15th"`}
/>

<p>Display larger numbers as text (the second parameter is the threshold, which by default is 9)</p>
<CodeBlock
	code={`place.column_key.toWords("cardinal", {threshold: -1}) // eg. "one hundred and five"`}
/>
