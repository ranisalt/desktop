<div id="watch-now" class="left startStreaming" data-torrent="" data-episodeid="" data-episode="" data-season=""><%=i18n.__("Watch Now") %></div>
<div class="dropdown-toggle left playerchoice" id="showDropdown" data-toggle="dropdown">
  <img class="imgplayerchoice" src="images/icons/local-icon.png"/>
  <span class="caret"></span>
</div>
<ul class="dropdown-menu playerchoicemenu" role="menu">
  <% _.each(items, function(item){ %>
    <li id ="player-<%= item.id %>">
      <a href="#" data-on="click" data-event-category="Player" data-event-action="SelectPlayer" data-event-label="<%= item.type %> - <%= item.name %>"><%= item.name %><img class="playerchoiceicon" src="images/icons/<%= item.type %>-icon.png"/>
    </a>
    </li>
  <% }); %>
</ul>
