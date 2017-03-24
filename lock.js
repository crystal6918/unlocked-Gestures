(function() {
	window.Lock = function() {};

	Lock.prototype.init = function() {
		this.initDom();
		this.path = []; //解锁路径
		this.cachePath = []; //临时存储路径
		this.startDraw = false; //是否开始绘制解锁图案
		this.canvas = document.getElementById('canvas');
		this.ctx = this.canvas.getContext('2d');
		this.createGraph();
		this.addEvent();
	};

	//初始化绘图界面
	Lock.prototype.initDom = function() {
		var container = document.getElementById('container');
		var htmlStr = '<canvas id="canvas" width="300" height="300"></canvas>';
		htmlStr += '<div id="tip">请输入手势密码</div>'
		htmlStr += '<label for="setLock"><input type="radio" id="setLock" value="setLock" name="lock" checked>设置密码</label>' +
			'<label for="checkLock"><input type="radio" id="checkLock" value="checkLock" name="lock">验证密码</label>';
		container.innerHTML = htmlStr;
	}

	Lock.prototype.createGraph = function() {
		this.r = this.ctx.canvas.width / 12;
		var r = this.r;
		var pos = [];
		var startX = 2 * r;
		var startY = 2 * r;
		var count = 1;
		for (var i = 0; i < 3; i++) {
			for (var j = 0; j < 3; j++) {
				pos.push({
					x: startX,
					y: startY,
					index: count
				})
				this.drawCircle(startX, startY, 'white');
				startX += 4 * r;
				count++;
			}
			startX = 2 * r;
			startY += 4 * r;
		}
		this.pos = pos;
	}

	//绑定touch事件
	Lock.prototype.addEvent = function() {
		var self = this;
		this.canvas.addEventListener('touchstart', function(e) {
			e.preventDefault();
			self.path = [];
			if (self.cachePath.length == 0) {
				self.showTip("请输入手势密码");
			}


			var touchPos = self.getPosition(e);
			for (var i = 0; i < 9; i++) {
				if (Math.abs(touchPos.x - self.pos[i].x) < self.r && Math.abs(touchPos.y - self.pos[i].y) < self.r) {
					self.path.push({
						x: self.pos[i].x,
						y: self.pos[i].y,
						index: self.pos[i].index
					});
					self.startDraw = true;
				}
			}
		}, false);

		this.canvas.addEventListener('touchmove', function(e) {
			if (self.startDraw) {
				var touchPos = self.getPosition(e);
				var pathLen = self.path.length;
				var lastPos;

				self.drawActive();
				self.drawLine(touchPos);

				for (var i = 0; i < self.pos.length; i++) {
					if (Math.abs(touchPos.x - self.pos[i].x) < self.r && Math.abs(touchPos.y - self.pos[i].y) < self.r) {
						lastPos = self.path[pathLen - 1];
						if (self.pos[i].index != lastPos.index) {
							self.path.push({
								x: self.pos[i].x,
								y: self.pos[i].y,
								index: self.pos[i].index
							});
						}

					}
				}
			}
		}, false);

		this.canvas.addEventListener('touchend', function(e) {
			var checkLock = document.getElementById("checkLock").checked;
			if (self.path.length < 5) {
				self.showTip("密码太短，至少需要5个点");
			} else {
				if (checkLock) {
					self.checkLock();
				} else {
					self.setLock();
				}


			}

		}, false);

		document.getElementById("checkLock").addEventListener('click',function(){
			self.showTip("验证密码");
		})
	};

	//画圆
	Lock.prototype.drawCircle = function(startX, startY, color) {

		var ctx = this.ctx;
		ctx.fillStyle = color;
		ctx.beginPath();
		ctx.arc(startX, startY, this.r, 0, 2 * Math.PI, true);
		ctx.closePath();
		ctx.fill();
	};

	//每一次move都重新绘制；将被选中的圆变成黄色
	Lock.prototype.drawActive = function() {
		this.clear();
		for (var i = 0; i < this.path.length; i++) {
			this.drawCircle(this.path[i].x, this.path[i].y, '#ffa726');
		}
	}

	//画线
	Lock.prototype.drawLine = function(touchPos) {

		this.ctx.strokeStyle = "red"
		this.ctx.beginPath();
		this.ctx.lineWidth = 1;
		this.ctx.moveTo(this.path[0].x, this.path[0].y);
		for (var i = 1; i < this.path.length; i++) {
			this.ctx.lineTo(this.path[i].x, this.path[i].y);
		}
		this.ctx.lineTo(touchPos.x, touchPos.y);
		this.ctx.stroke();
		this.ctx.closePath();
	}

	Lock.prototype.getPosition = function(e) {
		var area = e.currentTarget.getBoundingClientRect();
		var touchPos = {
			x: e.touches[0].clientX - area.left,
			y: e.touches[0].clientY - area.top
		}
		return touchPos;
	};

	Lock.prototype.setLock = function() {
		var path = this.path;
		var cachePath = this.cachePath;
		if (cachePath.length == 0) {
			this.cachePath = this.path;
			this.showTip("请再次输入手势密码");
			this.clear();
		} else {
			if (path.length !== cachePath.length) {
				this.showTip("两次输入的不一致,请重新设置");
				this.cachePath = [];
				return;
			}
			for (var i = 0; i < this.path.length; i++) {
				if (path[i].index !== cachePath[i].index) {
					this.showTip("两次输入的不一致,请重新设置");
					this.cachePath = [];
					return;
				}
			}
			this.showTip("密码设置成功");
			this.cachePath = [];
			this.clear();
			window.localStorage.setItem('path', JSON.stringify(this.path));
		}
	};

	Lock.prototype.checkLock = function() {
		var path = this.path;
		var realPath = JSON.parse(window.localStorage.getItem('path'));
		for (var i = 0; i < path.length; i++) {
			if (path[i].index !== realPath[i].index) {
				this.showTip("输入的密码不正确");
				this.clear();
				return;
			}
		}
		this.showTip("密码正确！");

	}


	Lock.prototype.showTip = function(content) {
		var tip = document.getElementById("tip");
		tip.innerText = content;
	}

	Lock.prototype.clear = function(){
		this.ctx.clearRect(0, 0, this.ctx.canvas.width, this.ctx.canvas.height);
		this.createGraph();
	}
}());