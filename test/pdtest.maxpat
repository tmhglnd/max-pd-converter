{
  "patcher": {
    "fileversion": 1,
    "appversion": {
      "major": 8,
      "minor": 1,
      "revision": 5,
      "architecture": "x64",
      "modernui": 1
    },
    "classnamespace": "box",
    "rect": [
      "148",
      "150",
      "387",
      "551"
    ],
    "bglocked": 0,
    "openinpresentation": 0,
    "default_fontsize": 12,
    "default_fontface": 0,
    "default_fontname": "Arial",
    "gridonopen": 1,
    "gridsize": [
      15,
      15
    ],
    "gridsnaponopen": 1,
    "objectsnaponopen": 1,
    "statusbarvisible": 2,
    "toolbarvisible": 1,
    "lefttoolbarpinned": 0,
    "toptoolbarpinned": 0,
    "righttoolbarpinned": 0,
    "bottomtoolbarpinned": 0,
    "toolbars_unpinned_last_save": 0,
    "tallnewobj": 0,
    "boxanimatetime": 200,
    "enablehscroll": 1,
    "enablevscroll": 1,
    "devicewidth": 0,
    "description": "",
    "digest": "",
    "tags": "",
    "style": "",
    "subpatcher_template": "",
    "assistshowspatchername": 0,
    "boxes": [
      {
        "box": {
          "id": "obj-0",
          "maxclass": "comment",
          "patching_rect": [
            "41",
            "46"
          ],
          "text": "Hello World!"
        }
      },
      {
        "box": {
          "id": "obj-1",
          "maxclass": "message",
          "patching_rect": [
            "43",
            "167"
          ],
          "text": "5"
        }
      },
      {
        "box": {
          "id": "obj-2",
          "maxclass": "message",
          "patching_rect": [
            "144",
            "170"
          ],
          "text": "6"
        }
      },
      {
        "box": {
          "id": "obj-3",
          "maxclass": "newobj",
          "patching_rect": [
            "89",
            "217"
          ],
          "text": "+ 11"
        }
      },
      {
        "box": {
          "id": "obj-4",
          "maxclass": "flonum",
          "patching_rect": [
            "88",
            "272",
            50,
            22
          ]
        }
      },
      {
        "box": {
          "id": "obj-5",
          "maxclass": "button",
          "patching_rect": [
            "86",
            "90",
            24,
            24
          ]
        }
      },
      {
        "box": {
          "id": "obj-6",
          "maxclass": "newobj",
          "patching_rect": [
            "86",
            "127"
          ],
          "text": "t b b"
        }
      }
    ],
    "lines": [
      {
        "patchline": {
          "destination": [
            "obj-3",
            "0"
          ],
          "source": [
            "obj-1",
            "0"
          ]
        }
      },
      {
        "patchline": {
          "destination": [
            "obj-3",
            "1"
          ],
          "source": [
            "obj-2",
            "0"
          ]
        }
      },
      {
        "patchline": {
          "destination": [
            "obj-4",
            "0"
          ],
          "source": [
            "obj-3",
            "0"
          ]
        }
      },
      {
        "patchline": {
          "destination": [
            "obj-6",
            "0"
          ],
          "source": [
            "obj-5",
            "0"
          ]
        }
      },
      {
        "patchline": {
          "destination": [
            "obj-1",
            "0"
          ],
          "source": [
            "obj-6",
            "0"
          ]
        }
      },
      {
        "patchline": {
          "destination": [
            "obj-2",
            "0"
          ],
          "source": [
            "obj-6",
            "1"
          ]
        }
      }
    ],
    "dependency_cache": [],
    "autosave": 0
  }
}
