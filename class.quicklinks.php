<?php

class  Quicklinks {
    private static $instance;

    protected $debug;

    protected $user = array(
        'status'       => 'init',
        'username'     => false,
        'isSuper'      => false,
        'quicklinks'   => false,
        'linksChanged' => false
    );

    /**
     * Returns the singleton instance of this class.
     *
     * @return Quicklinks The singleton instance.
     */
    public static function instance() {
        if ( ! self::$instance instanceof self) {
            self::$instance = new self();
        }

        return self::$instance;
    }

    protected function __construct() {
        $this->debug = Wms_Server::instance()->is_local();
        $this->add_actions();
    }

    function add_actions() {
        //add_action('wp_logout', array($this, 'delete_user_cookies'));

        // template redirect
        // @todo is this necessary now?
        if (substr($_SERVER['REQUEST_URI'], 0, 3) == '/ql') {
            add_action('template_redirect', array(&$this, 'quick_links_template'), 1);
        }

        //---- MAP AJAX CALLS TO PHP FUNCTIONS ----//

        // Get Williams links
        add_action("wp_ajax_quicklinks_get_static_links", array($this, 'get_static_links'));
        add_action("wp_ajax_nopriv_quicklinks_get_static_links", array($this, 'get_static_links'));

        // Save/Logout
        add_action("wp_ajax_quicklinks_update_user", array($this, 'update_user'));
        add_action("wp_ajax_nopriv_quicklinks_update_user", array($this, 'update_user'));

        // Login
        add_action("wp_ajax_quicklinks_login", array($this, 'login'));
        add_action("wp_ajax_nopriv_quicklinks_login", array($this, 'login'));

        // disable Domain Mapping plugin wp_logout action
        if (defined('DOING_AJAX')) {
            remove_action('wp_logout', 'remote_logout_loader', 9999);
        }
    }

    /**
     * Send json response
     */
    function respond_and_die($updated = array()) {
        $this->extend_user($updated);
        // decode
        echo json_encode($this->user);
        die();
    }

    /**
     * @param $updated
     */
    function extend_user($updated) {
        $this->user = wp_parse_args($updated, $this->user);
    }

    /**
     * Saves user links and updates usermeta table.
     */
    function update_user() {
        // Load default user with cookie links, if any.
        $this->extend_user(json_decode(stripslashes($_REQUEST['obj'])));

        $this->get_links();
    }

    function get_links() {
        // Are we already logged in via cookie 'quicklinks_user'?
        if ($this->user['username']) {
            $wp_uid = $this->get_wp_user_id($this->user['username']);
            switch ($this->user['status']) {
                case 'put':
                    // Save links to db.
                    $this->extend_user($this->save_user_links($wp_uid));
                    break;
                case 'restore':
                    $this->extend_user(array(
                        'quicklinks'   => $this->get_default_links(),
                        'status'       => 'Fetching default links.',
                        'linksChanged' => false
                    ));
                    break;
                case 'get':
                default:
                    $this->get_user_links($wp_uid);
                    break;
            }
            // Then exit.
            $this->respond_and_die($this->user);
        } else {
            // Load default links if no cookie links.
            if ($this->user['quicklinks']) {
                $this->respond_and_die(array(
                    'isSuper'      => false,
                    'status'       => 'No user specified but cookie exists. Fetching cookie links.',
                    'linksChanged' => true
                ));
            } else {
                $this->respond_and_die(array(
                    'isSuper'      => false,
                    'quicklinks'   => $this->get_default_links(),
                    'status'       => 'No user specified. Fetching default links.',
                    'linksChanged' => false
                ));
            }
        }
    }

    /**
     * @param $wp_uid
     *
     * @return {Array} user
     */
    function save_user_links($wp_uid) {
        if (update_user_meta($wp_uid, 'wms_quicklinks', json_encode($this->user['quicklinks'], JSON_UNESCAPED_UNICODE))) {
            return array('status' => 'Links saved.');
        } else {
            return array('status' => 'Links unchanged.');
        }
    }

    /**
     * @param $wp_user
     *
     * @return bool
     */
    function get_user_links($wp_uid) {
        if (is_integer($wp_uid)) {
            if ($quicklinks = $this->get_saved_links($wp_uid)) {
                $status       = 'You are logged in. I retrieved your saved links.';
                $linksChanged = true;
            } else {
                $quicklinks   = $this->get_default_links();
                $status       = 'You are logged in. I didn\'t find saved links so I\'m fetching default links';
                $linksChanged = false;
            }
            $this->extend_user(array(
                'linksChanged' => $linksChanged,
                'status'       => $status,
                'isSuper'      => $this->is_super($wp_uid),
                'quicklinks'   => $quicklinks
            ));

            return true;
        }

        return false;
    }

    /**
     * Log in and return user.
     */
    function login() {
        $login    = json_decode(stripslashes($_REQUEST['obj']));
        $username = $login->username;
        $password = $login->password;
        $this->extend_user(array(
            'quicklinks' => $login->user->quicklinks
        ));

        // Die if no user input.
        if ( ! $username || ! $password) {
            $this->respond_and_die(array(
                'status' => 'Oops! Don\'t forget to fill in both your username and password.'
            ));
        }

        // Load ldap library.
        include(WMS_EXT_LIB . '/ldap/ldap-auth.php');

        // Die if unrecognized LDAP email.
        if ( ! $this->debug) {
            $email = authenticateAgainstLDAP($username, $password, 'email');
            if ( ! $email || $email === 'UNKNOWN') {
                $this->respond_and_die(array(
                    'status' => 'Yikes! Authentication failed. Check your stuff and try again.'
                ));
            }
        }

        // Does user have a wp account?
        $wp_uid = username_exists($username);
        // Create user if one does not exist.
        if ( ! $wp_uid && $password && $email) {
            $wp_uid = wpmu_create_user($username, $password, $email);
            if ( ! $wp_uid) {
                $this->respond_and_die(array(
                    'status' => 'Oh noes! Could not find your Williams account. 
                            Please contact the <a href="mailto:webteam@williams.edu">webteam</a> 
                            if you are having problems logging in.'
                ));
            }
        }

        $this->extend_user(array(
            'username' => $username,
            'status'   => $login->user->status
        ));

        $this->get_links();
    }

    function delete_user_cookies() {
        setcookie('Quicklinks', '', time() - 3600);
        setcookie('quicklinks_super', '', time() - 3600);
    }

    function quick_links_template() {
        // (this will pick up requests for people who don't have a post)
        status_header(200);
        get_template_part('template-quicklinks');
        die();
    }

    function is_super($wp_uid) {
        return is_super_admin(get_user_by('id', $wp_uid) ? true : false);
    }

    /**
     * Loads user's custom links/feeds saved in usermeta wordpress table
     *
     * @param $user
     */
    function get_saved_links($wp_uid) {
        if ( ! $links = get_user_meta($wp_uid, 'wms_quicklinks', true)) {
            return false;
        }

	        return json_decode($links);
    }

    /**
     * Return curated list of flexiform links
     *
     * @return string
     */
    function get_default_links() {
        $items = $this->get_flexi_data('ql: default');

        return $this->build_links($items);
    }

    function get_static_links() {
        $default_links  = $this->get_flexi_data('ql: default');
        $most_pop_links = $this->get_flexi_data('dir: A-Z');
        $items          = array_merge($default_links, $most_pop_links);

        echo json_encode($this->build_links($items));
        die();
    }

    /**
     * Takes a flexiform array and builds a string out of it
     * with just the fields we want (title, url).
     *
     * @param      $items
     * @param bool $sort
     *
     * @return string
     */
    function build_links($items) {
        $links = array();

        foreach ($items as $item => $data) {
            $title    = $data['Title']['value'];
            $url      = $data['URL']['value'];
            $links [] = array(
                'title' => $title,
                'url'   => $url
            );
        }

        // order links alphabetically
        usort($links, array(
            $this,
            'sort_links'
        ));

        return $links;
    }

    function sort_links($a, $b) {
        if ($a['title'] == $b['title']) {
            return 0;
        }

        return ($a['title'] < $b['title']) ? -1 : 1;
    }

    function get_flexi_data($search) {
        // queries flexiform directory database for tags/search
        $args = array(
            'schemaID'     => 12076,
            // directory data
            'searchFields' => array(26549),
            // tag field
            'searchString' => $search,
        );
        $data = flexiform_get_data($args);

        return $data;
    }

    function get_wp_user_id($username) {
        // converts unix name to wordpress user id
        if ( ! $username) {
            return false;
        }
        // convert username to ID
        $wp_user = get_user_by('login', $username);

        return $wp_user->ID;
    }

    function getEditorTabs() {
        $tabs = array(
            array(
                'title'   => 'Divider',
                'content' => <<<EOD
<p> Add a section divider to help you organize your links. </p>
<form>
    <div class="form-item">
        <label for="custom-item-title">Title</label>
        <input type="text" name="custom-item-title" class="custom-item-title" value="" title="Item title">
    </div>
    <div class="buttons">
        <input type="hidden" name="custom-form" value="divider" />
        <button class="btn quick-tool" data-tool="add-custom">Add</button>
    </div>
</form>
EOD
            ),
            array(
                'title'   => 'Custom',
                'content' => <<<EOD
<p>Enter a descriptive title and any URL to add it to your quick links.</p>
<form>
    <div class="form-item">
        <label for="custom-item-title">Title</label>
        <input type="text" name="custom-item-title" class="custom-item-title" value="" title="Item title">
    </div>
    <div class="form-item">
        <label for="custom-item-url">URL</label>
        <input type="text" class="custom-item-url" name="custom-item-url" value="" title="Item URL">
    </div>
    <div class="buttons">
        <input type="hidden" name="custom-form" value="link" />
        <button class="btn quick-tool" data-tool="add-custom">Add</button>
    </div>
</form>
EOD
            ),
            array(
                'title'   => 'Williams',
                'content' => <<<EOD
<p> To add a link to your Quick Links, drag the link or click its plus icon.</p>
<input class="filter" type="text" name="quick-filter-input" id="quick-filter-input" title="Filter this list">
<ul id="static-links"></ul>
EOD
            )
        );

        $tab_group = array();
        foreach ($tabs as $tab) {
            array_push($tab_group, "[tab title=\"{$tab['title']}\"]{$tab['content']}[/tab]");
        }

        return do_shortcode('[tabs id="ql-expandos" hide_anchor="true" single_open="true"]' . join("\n", $tab_group) . '[/tabs]');
    }

    /**
     * Private clone method to prevent cloning of the instance of the
     * singleton instance.
     *
     * @return void
     */
    private function __clone() {
    }

    /**
     * Private unserialize method to prevent unserializing of the singleton
     * instance.
     *
     * @return void
     */
    private function __wakeup() {
    }
}

Quicklinks::instance();