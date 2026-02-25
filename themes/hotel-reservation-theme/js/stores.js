/*
* 2007-2017 PrestaShop
*
* NOTICE OF LICENSE
*
* This source file is subject to the Academic Free License (AFL 3.0)
* that is bundled with this package in the file LICENSE.txt.
* It is also available through the world-wide-web at this URL:
* http://opensource.org/licenses/afl-3.0.php
*
*  @author PrestaShop SA <contact@prestashop.com>
*  @copyright  2007-2017 PrestaShop SA
*  @license    http://opensource.org/licenses/afl-3.0.php  Academic Free License (AFL 3.0)
*  International Registered Trademark & Property of PrestaShop SA
*/

var map, markers = [], locationSelect;

$(document).ready(function(){
    map = L.map('map').setView([defaultLat, defaultLong], 10);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
        maxZoom: 19,
    }).addTo(map);

    locationSelect = document.getElementById('locationSelect');
    locationSelect.onchange = function() {
        var markerNum = locationSelect.options[locationSelect.selectedIndex].value;
        if (markerNum !== 'none' && markers[markerNum]) {
            markers[markerNum].openPopup();
            map.setView(markers[markerNum].getLatLng(), 14);
        }
    };

    $('#addressInput').keypress(function(e) {
        code = e.keyCode ? e.keyCode : e.which;
        if(code.toString() == 13)
            searchLocations();
    });

    $(document).on('click', 'input[name=location]', function(e){
        e.preventDefault();
        $(this).val('');
    });

    $(document).on('click', 'button[name=search_locations]', function(e){
        e.preventDefault();
        searchLocations();
    });

    initMarkers();
});

function initMarkers()
{
    searchUrl += '?ajax=1&all=1';
    downloadUrl(searchUrl, function(data) {
        var xml = parseXml(data.trim());
        var markerNodes = xml.documentElement.getElementsByTagName('marker');
        var bounds = [];
        for (var i = 0; i < markerNodes.length; i++)
        {
            var name = markerNodes[i].getAttribute('name');
            var address = markerNodes[i].getAttribute('address');
            var other = markerNodes[i].getAttribute('other');
            var id_store = markerNodes[i].getAttribute('id_store');
            var has_store_picture = markerNodes[i].getAttribute('has_store_picture');
            var lat = parseFloat(markerNodes[i].getAttribute('lat'));
            var lng = parseFloat(markerNodes[i].getAttribute('lng'));
            createMarker([lat, lng], name, address, other, id_store, has_store_picture);
            bounds.push([lat, lng]);
        }
        if (bounds.length) {
            map.fitBounds(bounds);
            if (map.getZoom() > 10) map.setZoom(10);
        }
    });
}

function searchLocations()
{
    $('#stores_loader').show();
    var address = document.getElementById('addressInput').value;

    fetch('https://nominatim.openstreetmap.org/search?format=json&q=' + encodeURIComponent(address))
        .then(function(response) { return response.json(); })
        .then(function(results) {
            if (results && results.length > 0) {
                var location = results[0];
                searchLocationsNear({lat: parseFloat(location.lat), lng: parseFloat(location.lon)});
            } else {
                if (!!$.prototype.fancybox && isCleanHtml(address))
                    $.fancybox.open([
                        {
                            type: 'inline',
                            autoScale: true,
                            minHeight: 30,
                            content: '<p class="fancybox-error">' + address + ' ' + translation_6 + '</p>'
                        }
                    ], {
                        padding: 0
                    });
                else
                    alert(address + ' ' + translation_6);
            }
            $('#stores_loader').hide();
        })
        .catch(function() {
            $('#stores_loader').hide();
            alert(address + ' ' + translation_6);
        });
}

function clearLocations(n)
{
    for (var i = 0; i < markers.length; i++)
        map.removeLayer(markers[i]);

    markers.length = 0;

    locationSelect.innerHTML = '';
    var option = document.createElement('option');
    option.value = 'none';
    if (!n)
        option.innerHTML = translation_1;
    else
    {
        if (n === 1)
            option.innerHTML = '1'+' '+translation_2;
        else
            option.innerHTML = n+' '+translation_3;
    }
    locationSelect.appendChild(option);

    if (!!$.prototype.uniform)
        $("select#locationSelect").uniform();

    $('#stores-table tr.node').remove();
}

function searchLocationsNear(center)
{
    var radius = document.getElementById('radiusSelect').value;
    var searchUrl = baseUri+'?controller=stores&ajax=1&latitude=' + center.lat + '&longitude=' + center.lng + '&radius=' + radius;
    downloadUrl(searchUrl, function(data) {
        var xml = parseXml(data.trim());
        var markerNodes = xml.documentElement.getElementsByTagName('marker');
        var bounds = [];

        clearLocations(markerNodes.length);
        $('table#stores-table').find('tbody tr').remove();
        for (var i = 0; i < markerNodes.length; i++)
        {
            var name = markerNodes[i].getAttribute('name');
            var address = markerNodes[i].getAttribute('address');
            var other = markerNodes[i].getAttribute('other');
            var distance = parseFloat(markerNodes[i].getAttribute('distance'));
            var id_store = parseFloat(markerNodes[i].getAttribute('id_store'));
            var phone = markerNodes[i].getAttribute('phone');
            var has_store_picture = markerNodes[i].getAttribute('has_store_picture');
            var lat = parseFloat(markerNodes[i].getAttribute('lat'));
            var lng = parseFloat(markerNodes[i].getAttribute('lng'));

            createOption(name, distance, i);
            createMarker([lat, lng], name, address, other, id_store, has_store_picture);
            bounds.push([lat, lng]);
            address = address.replace(phone, '');

            $('table#stores-table').find('tbody').append('<tr ><td class="num">'+parseInt(i + 1)+'</td><td class="name">'+(has_store_picture == 1 ? '<img src="'+img_store_dir+parseInt(id_store)+'.jpg" alt="" />' : '')+'<span>'+name+'</span></td><td class="address">'+address+(phone !== '' ? ''+translation_4+' '+phone : '')+'</td><td class="distance">'+distance+' '+distance_unit+'</td></tr>');
            $('#stores-table').show();
        }

        if (bounds.length) {
            map.fitBounds(bounds);
            if (map.getZoom() > 13) map.setZoom(13);
        }
        locationSelect.style.visibility = 'visible';
        $(locationSelect).parent().parent().addClass('active').show();
        locationSelect.onchange = function() {
            var markerNum = locationSelect.options[locationSelect.selectedIndex].value;
            if (markers[markerNum]) {
                markers[markerNum].openPopup();
                map.setView(markers[markerNum].getLatLng(), 14);
            }
        };
    });
}

function createMarker(latlng, name, address, other, id_store, has_store_picture)
{
    var html = '<b>'+name+'</b><br/>'+address+(has_store_picture === 1 ? '<br /><br /><img src="'+img_store_dir+parseInt(id_store)+'.jpg" alt="" />' : '')+other+'<br /><a href="https://www.openstreetmap.org/directions?engine=fossgis_osrm_car&route=;'+latlng[0]+','+latlng[1]+'" target="_blank">'+translation_5+'<\/a>';

    var markerOptions = {};
    if (hasStoreIcon) {
        markerOptions.icon = L.icon({
            iconUrl: img_ps_dir + logo_store,
            iconSize: [24, 24],
            iconAnchor: [12, 24],
            popupAnchor: [0, -24],
        });
    }

    var marker = L.marker(latlng, markerOptions).addTo(map);
    marker.bindPopup(html);
    markers.push(marker);
}

function createOption(name, distance, num)
{
    var option = document.createElement('option');
    option.value = num;
    option.innerHTML = name+' ('+distance.toFixed(1)+' '+distance_unit+')';
    locationSelect.appendChild(option);
}

function downloadUrl(url, callback)
{
    var request = window.ActiveXObject ?
    new ActiveXObject('Microsoft.XMLHTTP') :
    new XMLHttpRequest();

    request.onreadystatechange = function() {
        if (request.readyState === 4) {
            request.onreadystatechange = doNothing;
            callback(request.responseText, request.status);
        }
    };

    request.open('GET', url, true);
    request.send(null);
}

function parseXml(str)
{
    if (window.ActiveXObject)
    {
        var doc = new ActiveXObject('Microsoft.XMLDOM');
        doc.loadXML(str);
        return doc;
    }
    else if (window.DOMParser)
        return (new DOMParser()).parseFromString(str, 'text/xml');
}

function doNothing()
{
}
