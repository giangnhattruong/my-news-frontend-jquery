$(document).ready(function() {
	const config = {
		topHeadlines   : {
			url  : 'https://gnews.io/api/v4/top-headlines?lang=en&token=351d5dfd462a396a8fcb8f178c04eda1',
			text : 'Top headlines'
		},
		queryHeadlines : {
			url  : 'https://gnews.io/api/v4/search?lang=en&token=351d5dfd462a396a8fcb8f178c04eda1',
			text : 'Back to top headlines'
		},
		error          : {
			serverProblemText : 'The headlines is temporary unavailable, please try again later.',
			noResultText      : 'No article was found, please try again.'
		}
	};

	/**
	 * Add event
	 */
	$('.brand, .line-grey').click(getTopHeadlines);
	$('.search-btn').click(showSearchBox);
	$('.close-btn, .backdrop').click(hideSearchBox);
	$('#search-form').submit(getQueryHeadlines);
	/**
	 * Start getting top headlines data and append to page
	 */
	getTopHeadlines();

	/**
	 * Get top headlines and append to page @see {@link addTopHeadlines}, @see {@link addEmptyMessage}
	 * Step:
	 * The original HTML has 2 main element, #top-headline and #query-headline.
	 * Hide #query-headline main, only show #top-headlines main.
	 * Add navigating text to the div below Brand logo.
	 * Add loading icon waiting for data
	 * Do ajax get API data and append informations to #top-headline main element
	 */
	function getTopHeadlines() {
		$('#query-headline').hide();
		$('.line-grey').html(`<p>${config.topHeadlines.text}</p>`);
		onLoading();
		$.ajax({
			url      : config.topHeadlines.url,
			dataType : 'json',
			success  : addTopHeadlines,
			error    : addEmptyMessage
		});
	}

	/**
	 * Get data and add data to existing template in #top-heading main element @see {@link formatIsoDateToLocale}
	 * @param {object} data - data received from server
	 */
	function addTopHeadlines(data) {
		showContent($('#top-headlines'));
		const { articles } = data;
		$('#top-headlines article').each(function(index, element) {
			$(element).find('.card-title a').text(articles[index].title);
			$(element).find('.card-description').text(articles[index].description);
			$(element).find('.card-status').text(formatIsoDateToLocale(articles[index].publishedAt));
			$(element).find('.article-link').attr('href', articles[index].url);
			$(element).find('img').attr('src', articles[index].image);
		});
		$('.first-section, .second-section').after('<hr>');
	}

	/**
	 * Show backdrop and search box with animations
	 */
	function showSearchBox() {
		$('.backdrop').animate({ opacity: '0.5' }, 300, 'linear');
		$('.box').animate({ opacity: '1' }, 300, 'linear');
		$('.backdrop, .box').show();
	}

	/**
	 * Hide backdrop and search box with animations
	 */
	function hideSearchBox() {
		$('.backdrop, .box').animate({ opacity: '0' }, 300, 'linear', function() {
			$('.backdrop, .box').hide();
		});
	}

	/**
	 * Get query headlines and append to page @see {@link hideSearchBox}, @see {@link onLoading}, @see {@link formatToIsoDate}, @see {@link addQueryHeadlines}, @see {@link addEmptyMessage}
	 * Step:
	 * After search submit, hide search box
	 * The original HTML has 2 main element, #top-headline and #query-headline.
	 * Hide #top-headlines main, only show #query-headline main.
	 * Add navigating text to the div below Brand logo.
	 * Add loading icon waiting for data
	 * Make a search options object from search form values, format date,
	 * Remove option's properties with emppty values
	 * Do ajax get API data and append informations to #query-headline main element
	 * @param {object} event - Submit event which's default to be prevented
	 */
	function getQueryHeadlines(event) {
		event.preventDefault();
		hideSearchBox();

		$('#top-headline').hide();
		$('.line-grey').html(`<p>${config.queryHeadlines.text}</p>`);
		onLoading();

		const data = {};
		const inputArray = $('#search-form').serializeArray();
		$('#search-form').trigger('reset');
		$.each(inputArray, function(index, input) {
			const key = input.name;
			const value = input.value;
			data[key] = value;

			switch (key) {
				case 'from':
				case 'to':
					data[key] = value === '' ? value : formatToIsoDate(value);
			}
		});

		$.each(data, function(key, value) {
			if (!value) delete data[key];
		});

		$.ajax({
			url      : config.queryHeadlines.url,
			dataType : 'json',
			data,
			success  : addQueryHeadlines,
			error    : addEmptyMessage
		});
	}

	/**
	 * Get data and append data to HTML @see {@link addQueryArticles}
	 * @param {object} data - data received from server
	 */
	function addQueryHeadlines(data) {
		showContent($('#query-headlines'));
		$('#query-headlines').empty();
		const { articles } = data;
		if (!articles.length) {
			addEmptyMessage(config.error.noResultText);
		} else {
			$.each(articles, addQueryArticles);
		}
	}

	/**
	 * Append section with query articles to #query-headlines main element @see{@link formatIsoDateToLocale}
	 * @param {number} index 
	 * @param {object} article - A article in data
	 */
	function addQueryArticles(index, article) {
		$('#query-headlines').append(`
		<section class="row">
			<article class="col-12 card border-0 mb-3">
				<div class="row align-items-center">
					<div class="col-12 col-md-5 order-md-2">
						<a
						  class="article-link"
						  target="_blank"
						  href="${article.url}"
						>
							<img
							  class="img-fluid rounded"
							  src="${article.image}"
							>
						</a>
					</div>
					<div class="col-12 col-md-7 order-md-1">
						<div class="card-body">
							<h5 class="card-title">
							  <a 
								class="article-link"
								target="_blank"
								href="${article.url}"
							  >
								${article.title}
							  </a>
							</h5>
							<p class="card-description card-text">
							  ${article.description}
							</p>
							<p class="card-text">
							  <small class="card-status text-muted">
								${formatIsoDateToLocale(article.publishedAt)}
							  </small>
							</p>
						</div>
					</div>
				</div>
			</article>
		</section>
		`);
	}

	/**
	 * Show error message when server responses with error
	 */
	function addEmptyMessage(text = config.error.serverProblemText) {
		$('#loading-icon').remove();
		$('#no-article-found').show();
		$('#no-article-found').html(`
			<p>${text}</p>
			<div class="search-btn">
                <i class="bi bi-search"></i>
                <input class="" type="button" value="Search">
            </div>
		`);
		$('.search-btn').click(showSearchBox);
	}

	/**
	 * Show loading icon before while waiting for data
	 */
	function onLoading() {
		$('#top-headlines, #query-headlines, #no-article-found').hide();
		$('body').append(`<div id="loading-icon" class="spinner-border text-primary"
			role="status">
			<span class="sr-only"></span>
		</div>`);
	}

	/**
	 * Remove loading icon and show the main content
	 * @param {object} content - Element to be show
	 */
	function showContent(content) {
		$('#loading-icon').remove();
		content.show();
	}

	/**
	 * Convert ISO Date string to Locale Date String
	 * @param {string} isoDate 
	 * @returns {string}
	 */
	function formatIsoDateToLocale(isoDate) {
		const date = new Date(isoDate);
		return date.toLocaleString();
	}

	/**
	 * Convert miliseconds to ISO Date String
	 * @param {string} isoDate 
	 * @returns {string}
	 */
	function formatToIsoDate(miliseconds) {
		const date = new Date(miliseconds);
		const isoData = date.toISOString();
		return isoData.substr(0, 19) + 'Z';
	}
});
