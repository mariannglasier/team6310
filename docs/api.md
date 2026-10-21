# External Data and API Integration

Scenario maintenance and gameplay use the approved relational content model in [scenarios.md](scenarios.md). External sources provide provenance-backed inputs and facts; they do not generate authoritative financial rules or player outcomes.

# What APIs and Data Sources Do We Intend to Use? 

## 1. U.S. Government Census Data — American Community Survey (ACS) 5-Year Estimates 

Source: https://www.census.gov/data/developers/data-sets/acs-5year.html 

Integration method: REST API returning JSON data. 

Authentication: Census API key required. 

The American Community Survey (ACS) provides estimates of social, economic, housing, and demographic characteristics of the U.S. population. The application may use these statistics to establish real-world comparison metrics and provide context for simulation experiences. 

Potential uses include: 

Household and individual income statistics. 

Poverty rates and population demographics. 

Housing costs and housing characteristics. 

Employment and other socioeconomic indicators. 

The application must select specific variables and geographic areas for each statistic it requests. ACS estimates represent populations and geographic areas, rather than the exact circumstances of an individual simulated household. 

API base URL example: 

https://api.census.gov/data/2024/acs/acs5 

This is a dataset-specific base URL, not a complete request. Actual requests must specify the variables and geographic scope required. The year in the URL identifies the data release being requested. 

Developer documentation: https://www.census.gov/data/developers.html 

## 2. Housing Costs — HUD Fair Market Rents (FMR) 

Source: https://www.huduser.gov/portal/datasets/fmr/smallarea/index.html 

API documentation: https://www.huduser.gov/portal/dataset/fmr-api.html 

Integration method: REST API returning structured data, with downloadable datasets available as an alternative. 

Authentication: HUD USER API access token required for API requests. 

The U.S. Department of Housing and Urban Development (HUD) publishes Fair Market Rent estimates for geographic areas throughout the United States. These values vary by location and unit size, including efficiency units and units with multiple bedrooms. 

Potential uses include: 

Establishing housing-cost assumptions for simulation personas. 

Providing regional rent benchmarks for data visualizations. 

Comparing simulated housing expenses against published rent estimates. 

Fair Market Rents are administrative benchmarks used in housing assistance programs. They should not automatically be treated as the actual rent paid by every household or as a universal estimate of market rent. 

API base URL: 

https://www.huduser.gov/hudapi/public/fmr 

The API documentation describes the available endpoints, geographic identifiers, and authentication process. 

## 3. HUD Income Limits 

Source: https://www.huduser.gov/portal/datasets/il.html 

API documentation: https://www.huduser.gov/portal/dataset/fmr-api.html 

Integration method: HUD USER API or downloadable datasets. 

Authentication: HUD USER API access token required when using the API. 

HUD publishes income limits used to determine eligibility for various housing assistance programs. These limits vary according to geographic area, household size, and program-specific criteria. 

Potential uses include: 

Providing context for housing assistance eligibility. 

Comparing household income against relevant published income thresholds. 

Supporting simulation scenarios involving access to housing assistance programs. 

Income Limits are distinct from Fair Market Rents. The application must use the appropriate dataset and geographic and household-size criteria for the intended purpose. 

The FMR and Income Limits datasets are supported by HUD's API service. The exact endpoints and parameters needed for Income Limits must be selected from the official API documentation rather than assumed to be identical to the Fair Market Rent endpoints. 

## 4. Occupational Employment and Wage Statistics (OEWS) — Bureau of Labor Statistics 

Source: https://www.bls.gov/oes/tables.htm 

Integration method: Downloadable tables and datasets initially; API integration may be investigated if a suitable endpoint exists for the required data. 

Authentication: Depends on the selected integration method. API credentials may be required for the BLS API. 

The Bureau of Labor Statistics (BLS) publishes occupational employment and wage estimates for occupations and geographic areas. 

Potential uses include: 

Establishing wage assumptions for simulation personas. 

Comparing simulated earnings with published occupational wage estimates. 

Providing occupational and regional context for income-related visualizations. 

The OEWS tables are the intended starting point for occupation-specific wage information. The general BLS time-series API should not be assumed to provide every OEWS occupation-by-area statistic directly. 

If the required tables are available in a suitable downloadable format, importing them may be more practical than implementing an API integration. 

API documentation, if needed: https://www.bls.gov/developers/ 

## 5. USDA Food Plans — Monthly Cost of Food Reports 

Source: https://www.fns.usda.gov/research/cnpp/usda-food-plans/cost-food-monthly-reports 

Integration method: Downloadable Excel spreadsheets and published reports. 

Authentication: No API authentication is needed for manually downloaded public reports. 

The U.S. Department of Agriculture publishes food-plan cost estimates at different cost levels, with estimates organized by age and sex. The reports are updated monthly and include downloadable Excel files. 

Potential uses include: 

Establishing reference food-budget estimates. 

Comparing simulated food expenses with published food-plan costs. 

Supporting household food-budget assumptions based on household composition. 

These reports provide estimates for food plans, not the exact price of every individual food item. If a scenario requires the price of a specific item, such as an apple, the application will need a suitable item-level price source or a clearly documented assumption. 

Because the reports are available as downloadable files, the initial integration can use a controlled import process rather than requiring a live API request. 

## 6. Client-Provided Community Resources and Assistance Data 

Source: To be provided or confirmed by the client. 

Integration method: Undetermined until the client's existing data format is confirmed. 

The client may provide information about local poverty-relief resources, such as food assistance, clothing programs, or other services available to households experiencing financial hardship. 

Potential uses include: 

Representing available assistance in simulation scenarios. 

Supporting scenarios involving community resources. 

Providing real-world information about available services. 

Before integration, the project must establish whether the client provides an existing API, a database export, a spreadsheet, or manually maintained information. 

The data format, update frequency, available fields, and process for verifying information must be determined with the client. 

## 7. Electricity Prices — U.S. Energy Information Administration (EIA)
Source: 
https://catalog.data.gov/dataset/electricity-data-average-retail-price-of-electricity-application-programming-interface-api 

API documentation: 
https://www.eia.gov/opendata/documentation.php 

Integration method: REST API returning structured data in JSON by default, with XML also supported.

Authentication: EIA API key required. The key must be included in the request URL. 

The U.S. Energy Information Administration publishes electricity data, including average retail electricity prices by state and customer sector. The project can use the residential-sector data for Georgia to establish a reference electricity cost.

Potential uses include:

Establishing electricity-cost assumptions for simulation households.

Comparing simulated utility expenses against historical state-level prices.

Visualizing how residential electricity prices change over time.

API endpoint example:

https://api.eia.gov/v2/electricity/retail-sales/data/

Example request parameters would select the price data field, Georgia as the state, residential customers as the sector, and the desired reporting frequency and date range. The API returns observations with reporting periods, geographic identifiers, and price values. 

The returned prices are average retail prices, not individual household bills. Actual expenses depend on electricity consumption, utility rates, fees, and other factors. A simulation would need an explicit assumption about household electricity usage to calculate a monthly bill.

## 8. Consumer Price Index (CPI) for Food and Beverages — FRED
Source: 
https://fred.stlouisfed.org/series/CUURA319SAF 

API documentation: 
https://fred.stlouisfed.org/docs/api/fred/ 

Integration method: REST API returning structured data in JSON or XML. The observations endpoint also supports Excel and CSV downloads. 

Authentication: FRED API key required.

FRED, operated by the Federal Reserve Bank of St. Louis, provides access to economic time series published by government agencies and other sources. The series CUURA319SAF measures the Consumer Price Index for All Urban Consumers for food and beverages in the Atlanta–Sandy Springs–Roswell, Georgia metropolitan area. It is published by the U.S. Bureau of Labor Statistics and is reported monthly as an index, with a reference period of 1982–1984 = 100. 

Potential uses include:

Visualizing historical changes in food and beverage prices in the Atlanta metropolitan area.

Providing regional inflation context for the simulation.

Adjusting a previously established food-budget assumption to reflect changes in the price index, using a documented calculation.

Example API endpoint:

https://api.stlouisfed.org/fred/series/observations

Example request parameters:

series_id=CUURA319SAF

api_key=YOUR_API_KEY

file_type=json

The request can also specify a date range. The response contains dated observations and their corresponding index values. Missing observations must be handled explicitly. 

The CPI series measures changes in the price level for a category of consumer goods and services. It does not provide the current dollar price of a particular grocery item or the total amount a household needs to spend on food.

The application should retain the observation date, series identifier, units, and geographic scope when storing or displaying these values.

## 9. FINRA National Financial Capability Study (NFCS)
Source: 
https://www.finrafoundation.org/nfcs-data-and-downloads 

Integration method: Downloadable datasets, including CSV, Stata (.dta), and SPSS (.sav) files. The downloadable archives also include codebooks, questionnaires, and methodological documentation. No public REST API is documented on the cited download page. 

Authentication: No API key is required to download the publicly available datasets.

The FINRA Foundation's National Financial Capability Study collects survey data about financial behaviors, attitudes, knowledge, and access to financial products and services among U.S. adults. Its State-by-State Survey provides information that can be analyzed at both state and national levels. Survey data is collected approximately every three years. 

Potential uses include:

Providing real-world context for financial hardship and household financial resilience.

Comparing simulation outcomes with survey findings about emergency savings and financial preparedness, where suitable questions are available.

Visualizing differences in financial behaviors and reported financial circumstances between Georgia and the national population.

The intended integration method is a controlled dataset import:

Download the appropriate State-by-State Survey dataset from the official FINRA website.

Inspect the accompanying codebook and methodology documentation to identify relevant questions, response codes, and geographic fields.

Import the required data into the application's data store or a separate analysis workflow.

Filter the data for Georgia and calculate the appropriate statistics.

Record the survey year, source, sample information, and relevant methodological limitations alongside the resulting metrics.

The NFCS is primarily a survey-based source rather than a source of continuously updated economic measurements. Its findings are best suited to contextualizing simulation results in visualizations, rather than directly supplying current prices or defining simulation expenses.

The application must distinguish reported survey responses from measured economic outcomes and avoid treating survey findings as representative of every individual household.

 

# What Is the Purpose of These Data Sources? 

External economic data will support two primary features of the application: 

Simulation experiences: Establishing sourced financial assumptions, such as housing costs, food budgets, and income estimates. 

Data visualization: Providing real-world statistics against which simulation results can be compared. 

Using published economic data allows simulation experiences to reflect real-world conditions while retaining a consistent structure. When newer data becomes available, the application can incorporate it through a controlled update process rather than requiring the entire simulation design to be rewritten. 

Not every statistic can be used directly as a simulation expense or income value. Some data will require a documented conversion or adjustment, while some scenario details must remain explicit design assumptions. 

External data should be treated as a source of factual inputs, not as instructions for the AI to independently invent economic rules. 

How Do We Intend to Use These APIs and Data Sources? 

## 1. Data Used by Simulation Experiences 

### API-Based Data 

API-based sources will provide selected economic statistics used to configure simulation experiences. 

The intended process is: 

 1. Retrieve a statistic using the appropriate API endpoint, parameters, and geographic identifiers. 

 2. Validate the response and identify the relevant value, units, geography, and reporting period. 

 3. Store the retrieved data in the application's data store or cache. 

 4. Reference the stored value when configuring or generating a simulation. 

 5. When an update is requested and approved, retrieve the newer value and update the relevant simulation configuration. 

Where multiple simulations require the same statistic, the application may reuse the same retrieved source data. Individual simulations must still be able to retain the values they were configured to use when consistency is required. 

Each stored statistic should have enough metadata to identify its source, geographic scope, reporting period, units, and retrieval or import date. 

### Spreadsheet and Report-Based Data 

Sources that primarily provide downloadable files will initially use a controlled import process. 

The intended process is: 

 1. Obtain the latest appropriate file from the official source. 

 2. Import the relevant data into the application's data store. 

 3. Validate the imported fields, data types, units, and geographic identifiers. 

 4. Record the source and reporting period. 

 5. Make the imported values available to simulation configurations through the same general data-reference mechanism used for API-based statistics. 

This approach allows the application to use both API and file-based sources without requiring simulation cards to know how their underlying data was obtained. 

### Referencing Economic Values 

Simulation cards and configurations should reference approved economic values through stable identifiers rather than relying on the AI to invent or independently maintain financial figures. 

For example, a conceptual reference might be: 

{{data.monthly_food_cost}} 

This represents a proposed placeholder format, not a finalized implementation requirement. The application would resolve the identifier to an approved stored value. 

The reference mechanism must be defined during architecture and implementation. Regular expressions could help identify placeholders in text, but they would not replace the logic needed to retrieve, validate, and apply the referenced values. 

### Calculating Simulation Values 

Some simulation expenses will require calculations using sourced values and scenario-specific inputs. 

For example: 

expense = unit_price * quantity 

The unit price might come from an external dataset, while the quantity might be determined by the scenario or an explicitly defined simulation rule. 

The application must distinguish between: 

Sourced economic values, such as published prices or wage estimates. 

Scenario assumptions, such as the quantity of an item purchased. 

Simulation rules, such as how an expense affects the player's balance. 

Calculated values, produced by applying a defined formula to the inputs. 

The formulas, parameters, and assumptions used to produce financial values must be documented and consistently applied. AI-generated content may suggest scenarios or values for review, but generated suggestions should not automatically become authoritative economic data. 

The exact source-specific formulas and supported scenario mechanics remain to be determined; the money representation, rounding, signs, assistance cap, and edition/persistence rules are resolved in [scenarios.md](scenarios.md).

### Updating Simulation Data 

Economic datasets should be refreshed according to their publication schedules and the application's requirements. 

Refreshing a shared source dataset must not silently change the financial assumptions of an existing approved simulation or rewrite completed playthroughs. 

When newer source data becomes available, the application stages an affected draft edition with a before/after diff and validation results. Published editions are immutable; stable logical IDs may recur in edition-scoped records, and playthroughs retain their starting `version_id`. Do not overwrite active or completed content.

## Scenario generation and source bindings

An authorized administrator or maintenance process may create a generation request, but gameplay never asks a model to create content. Each request produces at most one scenario draft, uses the configured server-side model identifier (default: GPT-5.4 mini), and allows at most three total model attempts. Validation errors may be returned to later attempts; after the third failure the request is failed with actionable errors for staff. Generated prose, IDs, facts, costs, and effects are never trusted without validation and approval.

Scenario amounts use edition-scoped source bindings. A binding records its target field, source observation or approved assumption, units, controlled formula and inputs, resolved USD amount, and provenance. Use exact decimal/integer-cent calculations, round each final amount once to cents with half-cent ties away from zero, and keep `scenario_parameters` deferred until concrete reuse justifies it. The final binding schema and supported variables/formulas remain open in [scenarios.md](scenarios.md).

## 2. Data Used by Visualization

The visualization feature will use external statistics to provide real-world context for simulation results. 

Where suitable, the application may retrieve data directly from an API through the backend. Responses may be cached temporarily to reduce redundant requests and improve performance. 

The visualization data-access process should: 

 - Retrieve only the statistics required for the selected visualization. 

 - Reuse cached responses for equivalent requests where appropriate. 

 - Retain the reporting period and source information associated with each statistic. 

 - Handle API failures and unavailable data gracefully. 

 - Use a refresh policy appropriate to the source's publication schedule. 

 - Clearly distinguish real-world population statistics from simulated individual or household outcomes. 

Visualization data may use a temporary cache rather than permanent storage when historical retention is unnecessary. If the application needs reproducible historical comparisons, the relevant source values or snapshots may need to be retained. 

 

# How Often Should the Sources Be Queried or Updated?

In addition to source-specific release checks, run the maintenance check on the first day of every month at 12:00 a.m. `America/New_York` (`0 0 1 * *` in that timezone). Check APIs and approved CAC file-import locations, preserve immutable observations and revisions, and stage affected amounts, facts, mappings, and narrative in a pending edition. Staff approval is required before publication; active runs are never mutated.

Update frequency should be determined separately for each source. External economic datasets are published on different schedules, and checking for new data does not necessarily require downloading or reprocessing the entire dataset every time. 

Source 

Proposed update approach 

Census ACS 5-Year Estimates 

Check for new annual releases; retrieve the required variables when a relevant release becomes available. 

HUD Fair Market Rents 

Check for updated annual fiscal-year data and refresh relevant values when appropriate. 

HUD Income Limits 

Check for new published income-limit datasets and refresh relevant values when appropriate. 

BLS OEWS 

Check for new occupational employment and wage releases according to the relevant publication schedule. 

USDA Food Plans 

Check monthly for updated reports and import the relevant data. 

Client-provided data 

Follow the client's update schedule once confirmed. 

These are design requirements, not implemented schedules. The final refresh process should also account for failed requests, unavailable releases, API rate limits, and the need to validate newly retrieved data. A maintenance run must be idempotent for its month, retain last approved usable values when a source fails, and create at most one pending draft for a newly confirmed service.

For visualization, a shorter-lived cache may be appropriate to avoid repeated identical requests. However, the cache duration should reflect the dataset's publication frequency and the application's needs, rather than assuming every source changes in real time. 

# Where Will the Data Sources Be Used? 

Application component 

Intended use 

Simulation generation and configuration 

Supply approved economic inputs to simulation experiences. 

Simulation cards 

Reference sourced values and apply defined financial effects. 

Simulation execution 

Apply financial effects using application-defined rules. 

Data visualization 

Compare simulated outcomes against selected real-world statistics. 

Administrative interface 

Potentially manage data imports, review updated values, and approve simulation updates. 

Data storage 

Retain retrieved or imported values and the metadata required to identify their sources and reporting periods. 

The exact responsibilities of the administrative interface and the data-management components remain subject to the final application architecture. 

# Other Principles 

## Data Provenance 

Every externally sourced value should be traceable to its source and relevant reporting period. Where appropriate, stored values should also identify their geographic scope, units, and retrieval or import date. 

## Separation of Data, Rules, and Narrative 

External data provides economic inputs. Application logic defines how those inputs are transformed and how financial effects are applied. AI-generated content provides narrative and may suggest scenarios, but it does not independently control the authoritative economic data or simulation engine. 

## Consistency and Reproducibility 

An approved simulation should retain the financial assumptions used to configure it. Updating source data should not silently alter an existing experience or completed playthrough. 

## Validation and Error Handling 

Retrieved and imported data should be validated before use. The application should account for missing values, unexpected response formats, failed requests, and incompatible units or geographic identifiers. 

## API Credentials and Security 

API credentials must be stored and used through an appropriate backend or secure configuration mechanism. Credentials should not be exposed in client-side application code or included in public source control. 

## Appropriate Interpretation of Statistics 

Published statistics must be used in a way that reflects what they actually measure. Population-level estimates, eligibility thresholds, wage estimates, and housing benchmarks are not interchangeable with the actual circumstances of a particular household. 

## Controlled AI Generation 

AI-generated simulation content should use approved data and defined simulation rules. Generated financial values, data references, and card effects should be validated before a simulation is approved for use. 

## Data Updates and Historical Records 

Source data may change over time, but immutable observations, bindings, approved facts, and edition snapshots must explain which values informed a simulation or visualization. Existing playthroughs retain their starting edition; retention duration and cleanup policy remain subject to [security](security.md).

 

# How Does Each API or Data Source Send Us Data? 

## Census Bureau — ACS 5-Year API 

The Census API returns JSON-formatted tabular data. The first array contains the column names, and subsequent arrays contain the requested values for each geographic result. 

A request specifies the desired variables and geography through URL parameters. For example, a request may retrieve median household income for counties within a selected state. 

The application must interpret the returned variable identifiers and geographic codes to determine which value is appropriate for the intended use. 

## HUD — Fair Market Rents and Income Limits API 

The HUD USER API returns structured data through HTTP requests to documented endpoints. Requests use an access token supplied in the HTTP Authorization header as a Bearer token. 

The requested endpoint and parameters determine which dataset, geography, and reporting year are returned. The application must select the correct endpoint for Fair Market Rents or Income Limits and interpret the returned fields accordingly. 

## Bureau of Labor Statistics — OEWS 

The initial integration is expected to use downloadable tables or datasets from the BLS website. 

The application will need to import the relevant rows and columns and map them to consistent internal fields, such as occupation, geographic area, wage measure, units, and reporting period. 

If an API is selected later, its availability and suitability for the specific OEWS statistics must be verified before implementation. 

## USDA — Monthly Cost of Food Reports 

The USDA publishes reports and downloadable Excel files containing food-plan cost estimates. 

The application can obtain the appropriate file, import the required values, and associate them with the applicable report month, food plan, and household age/sex categories. 

The import process must account for changes in file structure or methodology between different report periods. 

## Client-Provided Data 

This data will come from a spreadsheet if avaliable.

The integration method and data-processing requirements will be established after the client confirms the available source and its maintenance process. 

 

# Outstanding Decisions 

The following items remain to be confirmed during architecture and implementation: 

The exact variables, wage measures, rent benchmarks, food-cost measures, and geographic areas required from each source. (Simulation Requirement) 

The internal format used to reference stored economic values from simulation cards and configurations. (Simulation Requirement) 

The database design for source data, cached responses, imported datasets, and simulation-specific values. (Simulation Requirement) 

The formulas and rules used to transform published statistics into simulation expenses and income. 

The exact API variables, source observations, geographies, quantities, conversions, baselines, and formulas for each binding.

The approval process for updated economic assumptions and AI-generated simulation experiences. 

The final cache durations and refresh schedules. 

The exact metrics and comparison methods used by the visualization feature. 

The format, scope, and update process for client-provided community resource data. 

The specific BLS integration method needed to obtain the intended occupation-specific wage statistics. 

These decisions should be resolved as the application architecture is finalized. The documentation establishes the intended responsibilities and integration boundaries without assuming that every implementation detail has already been decided. 

 
