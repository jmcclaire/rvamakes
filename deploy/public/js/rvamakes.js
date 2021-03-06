var Creative = Backbone.Model.extend({
    defaults: {
        name: "person name",
        img: "",
        url: "",
        tags: []
    },
    validation: {
        name: {
            required: true
        },
        email:{
            required: true,
            pattern: 'email'
        }
    }
});

/* **********************************************
     Begin Creatives.js
********************************************** */

var Creatives = Backbone.Collection.extend({
    model: Creative,
    url: 'api/creatives',
    randomId: function(){
        // get ubound of array
        var ubound = this.models.length;
        // get random index
        var randex = Math.floor(Math.random() * ubound);
        return this.models[randex].get("_id");
    }
});

/* **********************************************
     Begin AppHeaderView.js
********************************************** */

var AppHeaderView = Backbone.View.extend({
    el: "header",
    events: {
        "click .fob": "togglePanel",
        "click .options > div": "updateFilter",
        "click .prefix": "reset"
    },
    initialize: function () {

    },
    render: function () {

    },
    togglePanel: function () {
        this.$el.find('.options').fadeToggle(150);
    },
    updateFilter: function (e) {
        var $target = $(e.target);
        this.$el.find(".options .selected").removeClass("selected");
        $target.addClass("selected");
        this.$el.find(".current").html($target.html());
        this.$el.find(".options").fadeToggle(100);
        this.$el.trigger("filter:change", $target.data("filter"));
    },
    reset: function () {
        console.log('home');
        window.location.hash = "";
    }
});

/* **********************************************
     Begin AppFooterView.js
********************************************** */

var AppFooterView = Backbone.View.extend({
    el: "footer",
    initialize:function(){

    },
    render:function(){

    }
});

/* **********************************************
     Begin ListView.js
********************************************** */

var ListView = Backbone.View.extend({
    el: "#list",
    template: Mustache.compile($("#tmplListItem").html()),
    initialize:function(){
        // test touch - modernizr returns false positive on chrome
        // add chrome test
        var touch = Modernizr.touch,
            agent = navigator.userAgent || navigator.vendor || window.opera,
            test = /chrome/i.test(agent.toLowerCase());
        if (touch && test) touch = false;
        if (touch) this.$el.addClass('touch');

        this.listenTo(this.collection, "add update remove refresh reset", this.render);
    },
    render:function(){
        var self = this;
        self.$el.empty();
        var item = null;
        this.collection.models.forEach(function(model){
            item = new ListItemView({model:model});
            self.$el.append(item.el);
        });
    } 
});

/* **********************************************
     Begin ListItemView.js
********************************************** */

var ListItemView = Backbone.View.extend({
    tagName: "div",
    template: Mustache.compile($("#tmplListItem").html()),
    events:{
        "click": "click",
        "mouseOver": "mouseOver",
        "mouseOut": "mouseOut"
    },
    initialize:function(){
        this.render();
    },
    render:function(){
        //console.log("list item render", this.model.toJSON());
        var klasses = "item " + this.model.get("tags").join(" ");
        this.$el.addClass(klasses).html(this.template(this.model.toJSON()));
    },
    click:function(e){
        console.log("click", e);
        //this.$el.trigger('creative:show',)
    },
    mouseOver:function(){
        console.log("mouseOver");
    },
    mouseOut:function(){
        console.log("mouseOut");
    }
});

/* **********************************************
     Begin AboutView.js
********************************************** */

var AboutView = Backbone.View.extend({
    el: '#about',
    template: Mustache.compile($('#tmplAbout').html()),
    initialize: function(){
        this.render();
    },
    render:function(){
        this.$el.html(this.template());
    }
});

/* **********************************************
     Begin ShowView.js
********************************************** */

var ShowView = Backbone.View.extend({
    el: "#show",
    template: Mustache.compile($("#tmplShowItem").html()),
    renderCreative:function(json){
        this.$el.html(this.template(json));
    }
});

/* **********************************************
     Begin EntryView.js
********************************************** */

var EntryView = Backbone.View.extend({
    el: '#entry',
    template: Mustache.compile($('#tmplEntry').html()),
    events: {
        "submit form": "processEntry",
        "form:reset": "resetForm"
    },
    initialize: function () {
        this.render();
    },
    render: function () {
        this.$el.html(this.template());
        $('#upload').on('load', this.parseResponse);
    },
    processEntry: function (e) {
        var data = this.$el.find('form').serializeObject();
        var errors = this.validateForm(data);
        console.log(data, errors);
        if (errors.length > 0) {
            e.preventDefault();
            this.showErrors(errors);
        }
    },
    validateForm: function (data) {
        var validEmail = /[A-Z0-9._+-]+@[A-Z0-9.-]+\.[A-Z]{2,6}$/i;
        var validUrl = /^(http[s]?:\/\/){0,1}(www\.){0,1}[a-zA-Z0-9\.\-]+\.[a-zA-Z]{2,5}[\.]{0,1}/;

        var errors = [];
        if (data.name.length == 0) {
            errors.push({field: 'name', msg: 'Name is a required field'})
        }
        if (data.email.length == 0) {
            errors.push({field: 'email', msg: 'Email is a required field'})
        }
        if (!validEmail.test(data.email)) {
            errors.push({field: 'email', msg: 'A valid email is a required field'})
        }
        if (data.url.length > 0) {
            if (!validUrl.test(data.url)) {
                errors.push({field: 'url', msg: 'Url appear to be malformed, please review'})
            }
        }
        if (!data.tags || data.tags == "") {
            errors.push({field: 'tags', msg: 'Select 1 or more tags that describe you'})
        }
        if (data.tags instanceof Array) {
            if (data.tags.length > 3) {
                errors.push({field: 'tags', msg: 'The number of selected tags cannot exceed 3'})
            }
        }
        return errors;
    },
    showErrors: function (errors) {
        //console.log(errors);
    },
    parseResponse: function () {
        var res = $('#upload').contents().text();
        if (res) {
            try {
                res = JSON.parse(res);
            }
            catch (e) {
                // nom nom nom
            }

            // TODO: add error checking

            var creative = new Creative(res);

            $(this).trigger("creative:created", creative);
            $(this).trigger('form:reset');
        }
    },
    resetForm: function () {
        this.$el.find('form')[0].reset();
    }
});

/* **********************************************
     Begin AppView.js
********************************************** */

var AppView = Backbone.View.extend({
    el: "body",
    initialize: function () {
        this.router = new AppRouter();

        this.collections.creatives = new Creatives();
        this.collections.creatives.fetch({
            success: function () {
                Backbone.history.start();
            }
        });

        this.views.header = new AppHeaderView({});
        this.views.footer = new AppFooterView({});
        this.views.list = new ListView({collection: this.collections.creatives});
        this.views.show = new ShowView({});
        this.views.about = new AboutView({});
        this.views.entry = new EntryView({});

    },
    render: function () {

    },
    events: {
        "creative:created": "creative:created",
        "creative:show": "creative:show",
        "creative:random": "creative:random",
        "filter:change": "filter:change"
    },
    collections: {},
    views: {},
    "creative:created": function (e, model) {
        if (model instanceof Creative) {
            this.collections.creatives.add(model);
            this.router.navigate("#/show/" + model.get("_id"), true);
        }
    },
    "creative:show": function (e, data) {
        console.log('creative:show', data);
        var model = this.collections.creatives.findWhere({_id: data});
        this.views.show.renderCreative(model.toJSON());
    },
    "creative:random": function () {
        this.router.navigate("#/show/" + this.collections.creatives.randomId(), true);
    },
    "filter:change": function (e, data) {
        console.log(data);
        this.collections.creatives.filter();
        if (data == "") {
            this.router.navigate("#/", false);
        } else {
            this.router.navigate("#/filter/" + data, false);
        }
    }
});

/* **********************************************
     Begin AppRouter.js
********************************************** */

var AppRouter = Backbone.Router.extend({
    routes:{
        "list":"list",
        "about": "about",
        "entry": "entry",
        "show/:id": "show",
        "random": "random",
        "filter/:tag": "filter",
        '*path':  'defaultRoute'
    },
    initialize: function(){

    },
    hideSections: function () {
        $('section').hide();
    },
    defaultRoute:function(){
        this.list();
    },

    list: function () {
        console.log('list');
        this.hideSections();
        $('#list').show();

    },
    about: function () {
        console.log('about');
        this.hideSections();
        $('#about').show();
    },
    entry: function () {
        console.log('entry');
        this.hideSections();
        $('#entry').show();
    },
    show: function (data) {
        console.log('creative:show',data);
        $('body').trigger('creative:show', data);
        this.hideSections();
        $('#show').show();
    },
    random: function () {
        $('body').trigger('creative:random');
    },
    filter:function (tag){
        console.log('filter', tag);
        $('body').trigger('filter:change',data);
    }
});

/* **********************************************
     Begin app.js
********************************************** */

var app = new AppView();


